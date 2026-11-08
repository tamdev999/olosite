import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import dns from "dns/promises";

type MxRecord = { exchange: string; priority: number };

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory dedup — replace with a DB Set for multi-instance deploys
const registered = new Set<string>();

// ── Typo map for common providers ──────────────────────────────────────────
const TYPO_MAP: Record<string, string> = {
  "gmial.com":    "gmail.com",
  "gmai.com":     "gmail.com",
  "gamil.com":    "gmail.com",
  "gmaill.com":   "gmail.com",
  "gmail.co":     "gmail.com",
  "gmail.cm":     "gmail.com",
  "gnail.com":    "gmail.com",
  "hotmai.com":   "hotmail.com",
  "hotmial.com":  "hotmail.com",
  "hotmail.co":   "hotmail.com",
  "outloo.com":   "outlook.com",
  "outlok.com":   "outlook.com",
  "outlookcom":   "outlook.com",
  "yaho.com":     "yahoo.com",
  "yahooo.com":   "yahoo.com",
  "yahoo.co":     "yahoo.com",
  "iclod.com":    "icloud.com",
  "icloud.co":    "icloud.com",
};

// ── Strict RFC-5321 inspired regex ─────────────────────────────────────────
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidFormat(email: string): boolean {
  return EMAIL_RE.test(email);
}

// Check MX records; falls back to A/AAAA so a timeout is non-fatal
async function domainCanReceiveEmail(domain: string): Promise<{ ok: boolean; definitelyBad: boolean }> {
  try {
    const mx = await Promise.race([
      dns.resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3500)),
    ]) as MxRecord[];
    return { ok: mx.length > 0, definitelyBad: mx.length === 0 };
  } catch (err) {
    if (err instanceof Error && err.message === "timeout") {
      // DNS timed out — don't reject, let it through
      return { ok: true, definitelyBad: false };
    }
    // NXDOMAIN or other hard DNS error — domain definitely doesn't exist
    try {
      // Last resort: check for A record
      await dns.resolve(domain);
      return { ok: true, definitelyBad: false };
    } catch {
      return { ok: false, definitelyBad: true };
    }
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = body.email ?? "";
  const email = normalizeEmail(raw);

  // ── 1. Format check ──────────────────────────────────────────────────────
  if (!email || !isValidFormat(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 422 }
    );
  }

  const [, domain] = email.split("@");

  // ── 2. Typo suggestion ───────────────────────────────────────────────────
  const corrected = TYPO_MAP[domain];
  if (corrected) {
    const suggested = email.replace(domain, corrected);
    return NextResponse.json(
      { error: `Did you mean ${suggested}?`, suggestion: suggested },
      { status: 422 }
    );
  }

  // ── 3. DNS / domain check ────────────────────────────────────────────────
  const { ok: domainOk, definitelyBad } = await domainCanReceiveEmail(domain);
  if (!domainOk && definitelyBad) {
    return NextResponse.json(
      { error: `The domain "${domain}" doesn't appear to accept email. Please double-check your address.` },
      { status: 422 }
    );
  }

  // ── 4. Dedup ─────────────────────────────────────────────────────────────
  if (registered.has(email)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // ── 5. Save to Resend ────────────────────────────────────────────────────
  try {
    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: undefined as unknown as string,
    });
  } catch {
    // Fallback: notify via email if contacts API fails
    try {
      await resend.emails.send({
        from: "Olo Early Access <onboarding@resend.dev>",
        to: "support@getolo.ai",
        subject: "New Early Access Signup",
        html: `<p>New signup: <strong>${email}</strong></p><p>Source: early-access-landing</p><p>Time: ${new Date().toISOString()}</p>`,
      });
    } catch {
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  }

  // ── 6. Confirmation email ────────────────────────────────────────────────
  try {
    await resend.emails.send({
      from: "Olo <onboarding@resend.dev>",
      to: email,
      subject: "You're on the Olo early access list.",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#08090B;color:#f7f8f8;">
          <h1 style="font-size:24px;font-weight:700;color:#2DD4BF;margin:0 0 16px;">You're on the list.</h1>
          <p style="font-size:16px;line-height:1.6;color:#d0d6e0;margin:0 0 12px;">We'll be in touch when Olo is ready for you.</p>
          <p style="font-size:14px;color:#62666d;margin:0;">— The Olo Team</p>
        </div>
      `,
    });
  } catch {
    // Non-fatal
  }

  registered.add(email);

  return NextResponse.json({ ok: true });
}
