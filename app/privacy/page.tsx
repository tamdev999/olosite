import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | olo",
  description: "Privacy Policy for olo by SMB Automation Research LLC.",
};

const prose: React.CSSProperties = {
  fontFamily: "var(--font-geist-sans), Inter, sans-serif",
  color: "#d0d6e0",
  lineHeight: 1.7,
  fontSize: 16,
};

const h1Style: React.CSSProperties = {
  fontSize: "clamp(2rem, 4vw, 3rem)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: "#f7f8f8",
  margin: "0 0 8px",
};

const h3Style: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#f7f8f8",
  margin: "2em 0 0.5em",
};

const dateStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#62666d",
  marginBottom: "2.5rem",
};

export default function Privacy() {
  return (
    <div style={{ background: "#09090c", minHeight: "100vh", paddingTop: 100, paddingBottom: 120 }}>
      <div style={{ maxWidth: 720, marginInline: "auto", paddingInline: 24, ...prose }}>
        <h1 style={h1Style}>Privacy Policy</h1>
        <p style={dateStyle}>Effective Date: [Date]</p>

        <p>SMB Automation Research LLC, a Florida limited liability company, operates olo and meetolo.ai (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).</p>
        <p style={{ marginTop: "1em" }}>We respect your privacy. Here&rsquo;s what we collect, why we collect it, and what choices you have.</p>

        <h3 style={h3Style}>1. Information We Collect</h3>
        <p>When you sign up for early access, we collect:</p>
        <ul style={{ paddingLeft: "1.5em", marginTop: "0.5em" }}>
          <li>Your email address.</li>
          <li>Information you submit through our business calculator, including administrative hours, missed leads, profit per customer, hourly values, and selected tasks.</li>
          <li>Basic website usage statistics through Vercel Web Analytics.</li>
        </ul>

        <h3 style={h3Style}>2. How We Use Your Information</h3>
        <p>We use this information to:</p>
        <ul style={{ paddingLeft: "1.5em", marginTop: "0.5em" }}>
          <li>Contact you about early access, product updates, and launch announcements.</li>
          <li>Understand what small businesses need.</li>
          <li>Improve our website and future product.</li>
        </ul>
        <p style={{ marginTop: "1em" }}>We do not sell your personal information.</p>

        <h3 style={h3Style}>3. Third-Party Services</h3>
        <p>We use trusted providers to operate our website and communicate with you:</p>
        <ul style={{ paddingLeft: "1.5em", marginTop: "0.5em" }}>
          <li><strong style={{ color: "#f7f8f8" }}>Vercel:</strong> Website hosting and analytics.</li>
          <li><strong style={{ color: "#f7f8f8" }}>Resend:</strong> Email delivery.</li>
        </ul>
        <p style={{ marginTop: "1em" }}>These providers process information to deliver services on our behalf.</p>

        <h3 style={h3Style}>4. Cookies and Analytics</h3>
        <p>We do not use advertising or tracking cookies, and we do not sell or share visitor data for advertising.</p>
        <p style={{ marginTop: "1em" }}>To understand how our website is used, we collect basic, aggregated visitor statistics through Vercel Web Analytics, such as page views, referring websites, approximate location (country, region, or city), browser and device type. This service does not use tracking cookies and does not identify individual visitors.</p>
        <p style={{ marginTop: "1em" }}>Our hosting provider may also keep standard server logs (such as IP address, browser type, and time of visit) for security and performance purposes.</p>
        <p style={{ marginTop: "1em" }}>If we add other analytics or cookies in the future, we will update this policy.</p>

        <h3 style={h3Style}>5. Your Choices</h3>
        <p>You can unsubscribe from our emails at any time.</p>
        <p style={{ marginTop: "1em" }}>You can also request access to or deletion of your information by emailing <a href="mailto:josh@meetolo.ai" style={{ color: "#2DD4BF", textDecoration: "none" }}>josh@meetolo.ai</a>.</p>
        <p style={{ marginTop: "1em" }}>We retain information until you request deletion or it is no longer needed for the purposes described above.</p>

        <h3 style={h3Style}>6. Children&rsquo;s Privacy</h3>
        <p>Our website is intended for business owners and is not directed at children under 13. We do not knowingly collect personal information from children under 13.</p>

        <h3 style={h3Style}>7. Changes to This Policy</h3>
        <p>We may update this policy as our website and product evolve. Any changes will be posted here with an updated effective date.</p>

        <h3 style={h3Style}>8. Contact Us</h3>
        <p><strong style={{ color: "#f7f8f8" }}>SMB Automation Research LLC</strong></p>
        <p style={{ marginTop: "0.5em" }}>Email: <a href="mailto:josh@meetolo.ai" style={{ color: "#2DD4BF", textDecoration: "none" }}>josh@meetolo.ai</a></p>
        <p>Mailing Address: 78 SW 7th St, Miami, FL 33130</p>
        <p>Website: <a href="https://meetolo.ai" style={{ color: "#2DD4BF", textDecoration: "none" }}>https://meetolo.ai</a></p>
      </div>
    </div>
  );
}
