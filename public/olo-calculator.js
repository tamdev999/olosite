/*!
 * olo Business Savings Calculator — drop-in web component
 * Usage:  <script src="/olo-calculator.js" defer></script>
 *         <olo-calculator></olo-calculator>
 * Hook:   window.OloCalculator.onApply = (payload) => { ...send to your signup system... }
 *         or listen: document.addEventListener('olo:apply', e => e.detail)
 * No dependencies, no network calls. All math is deterministic and lives in CONFIG + compute().
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. CONFIGURATION — every assumption lives here
   * ------------------------------------------------------------------ */
  const CONFIG = {
    assumptions: {
      automationRate: 0.40,       // share of admin time olo can take on
      recoveryRate: 0.30,         // share of missed opportunities recovered by better follow-up
      conversionRate: 0.20,       // share of recovered opportunities that become paying customers
    },
    constants: {
      hoursPerMonth: 173.2,       // full-time hours per month (40 × 4.33)
      weeksPerMonth: 4.33,
      setupFee: 1000,             // one-time
    },
    plans: [                      // chosen by number of selected capabilities
      { name: "Starter", price: 799,  min: 1, max: 3 },
      { name: "Scale",   price: 999,  min: 4, max: 5 },
      { name: "Pro",     price: 1500, min: 6, max: 6 },
      { name: "Max",     price: 2500, min: 7, max: Infinity },
    ],
    activities: [
      { id: "calls",      label: "Customer calls & bookings",  icon: "phone" },
      { id: "email",      label: "Emails & follow-ups",        icon: "mail" },
      { id: "crm",        label: "CRM & lead management",      icon: "users" },
      { id: "invoicing",  label: "Invoicing & collections",    icon: "invoice" },
      { id: "scheduling", label: "Employee scheduling",        icon: "calendar" },
      { id: "payroll",    label: "Payroll",                    icon: "wallet" },
      { id: "other",      label: "Other administrative work",  icon: "grid" },
    ],
    // Preview panel sample figures (clearly labelled as a sample in the UI)
    sample: { benefit: 4180, time: 2380, profit: 1800, plan: "Scale", planPrice: 999 },
    // Early-access email capture on the results screen.
    // contactEmail: visitor's email app opens a pre-filled message to this address (no backend needed).
    // formEndpoint: optional (e.g. a free Formspree URL). If set, the email is sent silently instead.
    contactEmail: "matt@meetolo.ai",
    formEndpoint: null,
  };

  /* ------------------------------------------------------------------ *
   * 2. CALCULATION ENGINE — pure, deterministic
   * ------------------------------------------------------------------ */
  const num = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return isFinite(n) && n > 0 ? n : 0; };

  function recommendPlan(capabilityCount, plans = CONFIG.plans) {
    if (capabilityCount < 1) return null;
    return plans.find((p) => capabilityCount >= p.min && capabilityCount <= p.max) || plans[plans.length - 1];
  }

  function compute(inputs, a = CONFIG.assumptions, c = CONFIG.constants) {
    const hours = num(inputs.weeklyHours);
    const missed = num(inputs.missedOpportunities);
    const profit = num(inputs.profitPerCustomer);
    const staff = num(inputs.adminEmployees);
    const cost = num(inputs.monthlyCostPerEmployee);

    const adminPayroll = staff * cost;                       // context only — never added to benefit
    const hourlyCost = cost > 0 ? cost / c.hoursPerMonth : 0;
    const monthlyTimeValue = hours * c.weeksPerMonth * hourlyCost;
    const timeValueRecovered = monthlyTimeValue * a.automationRate;

    const customersRecovered = missed * a.recoveryRate * a.conversionRate;
    const customerProfit = customersRecovered * profit;

    const monthlyBenefit = timeValueRecovered + customerProfit;
    const plan = recommendPlan((inputs.activities || []).length);
    const subscription = plan ? plan.price : 0;
    const netMonthly = monthlyBenefit - subscription;
    const firstMonthNet = netMonthly - c.setupFee;

    return {
      hourlyCost, monthlyTimeValue, timeValueRecovered, customersRecovered, customerProfit,
      monthlyBenefit, adminPayroll, plan, subscription, netMonthly, firstMonthNet,
      flags: { noCost: hours > 0 && cost === 0, noProfit: missed > 0 && profit === 0 },
    };
  }

  /* ------------------------------------------------------------------ *
   * 3. FORMATTING + ICONS
   * ------------------------------------------------------------------ */
  const money = (n, opts = {}) => {
    const v = Math.round(n);
    const s = "$" + Math.abs(v).toLocaleString("en-US");
    return v < 0 ? "−" + s : (opts.plus && v > 0 ? "+" + s : s);
  };
  const pct = (x) => Math.round(x * 100) + "%";
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  const ICONS = {
    phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.6M18 19a5 5 0 0 0-3-4.6"/>',
    invoice: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M12.5 11.5c-.6-.6-1.4-.8-2.2-.6-1 .2-1.3 1.2-.6 1.8.5.4 1.6.5 2.2.9.8.5.6 1.7-.4 2-.8.2-1.7-.1-2.3-.7M11 10v1M11 16.5v1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-3v3"/><circle cx="16.5" cy="13.5" r="1.2"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 5 8 12l7 7"/>',
  };
  const icon = (k, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  const LOGO = '<svg class="logo" viewBox="190 370 872 464" aria-label="olo"><defs><linearGradient id="og" gradientUnits="userSpaceOnUse" x1="200" y1="600" x2="1052" y2="600"><stop offset="0" stop-color="#00f5dc"/><stop offset=".5" stop-color="#05d4f0"/><stop offset="1" stop-color="#0aa8ff"/></linearGradient></defs><g fill="none" stroke="url(#og)" stroke-width="22"><circle cx="392" cy="601" r="180"/><circle cx="861" cy="601" r="180"/></g><rect x="616" y="381" width="22" height="442" rx="11" fill="url(#og)"/></svg>';

  /* ------------------------------------------------------------------ *
   * 4. STYLES (scoped via Shadow DOM)
   * ------------------------------------------------------------------ */
  const CSS = `
  :host { all: initial; display: block; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .root {
    --teal: var(--olo-teal, #2ff0d4); --blue: #0aa8ff; --ink: #f4f7f8; --muted: #9aa3ab; --dim: #66707a;
    --bg: #07090a; --card: #111416; --card2: #15191c; --line: #252b30; --line2: #1e5551;
    --ease: cubic-bezier(.2,.8,.2,1);
    font-family: var(--olo-font, "Geist", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
    color: var(--ink); -webkit-font-smoothing: antialiased; line-height: 1.4;
  }
  .mono { font-family: var(--olo-mono, "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace); letter-spacing: .14em; text-transform: uppercase; }
  .ic { width: 22px; height: 22px; flex: none; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  input { font: inherit; color: inherit; }
  :focus-visible { outline: 2px solid var(--teal); outline-offset: 3px; border-radius: 10px; }

  /* ---------- Preview panel ---------- */
  .panel { position: relative; overflow: hidden; border-radius: 32px; background: radial-gradient(120% 90% at 85% 0%, #0d2a28 0%, #090b0c 55%) , var(--bg);
    border: 1px solid #1b2226; box-shadow: 0 40px 100px -20px rgba(3,40,38,.55), 0 2px 0 rgba(255,255,255,.03) inset;
    display: grid; grid-template-columns: 1fr 1.08fr; gap: 56px; padding: 64px; align-items: center; }
  .eyebrow { color: var(--teal); font-size: 13px; display: flex; align-items: center; gap: 10px; }
  .eyebrow::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 5px rgba(47,240,212,.14); }
  .h1 { margin-top: 18px; font-size: clamp(38px, 4.4vw, 64px); font-weight: 700; letter-spacing: -.045em; line-height: 1.02; }
  .h1 em { font-style: normal; color: var(--teal); }
  .sub { margin-top: 18px; font-size: clamp(17px, 1.4vw, 21px); color: var(--muted); max-width: 30ch; }
  .cta { margin-top: 34px; display: inline-flex; align-items: center; gap: 12px; height: 64px; padding: 0 30px; border-radius: 16px;
    background: var(--teal); color: #031a1c; font-size: 19px; font-weight: 700; letter-spacing: -.01em;
    box-shadow: 0 14px 40px -10px rgba(47,240,212,.55); transition: transform .2s var(--ease), box-shadow .2s var(--ease); }
  .cta:hover { transform: translateY(-2px); box-shadow: 0 20px 50px -10px rgba(47,240,212,.7); }
  .cta .arr { transition: transform .2s var(--ease); } .cta:hover .arr { transform: translateX(4px); }
  .meta { margin-top: 18px; font-size: 12px; color: var(--dim); }

  .mock { position: relative; border-radius: 22px; background: linear-gradient(180deg, #121618, #0c0f10); border: 1px solid #222a2f; padding: 26px; box-shadow: 0 30px 60px -20px #000; }
  .mock-top { display: flex; justify-content: space-between; align-items: center; }
  .mock-top .logo { height: 18px; }
  .chip { font-size: 11px; color: var(--muted); border: 1px dashed #3a434a; border-radius: 999px; padding: 5px 10px; }
  .mock-label { margin-top: 22px; font-size: 12px; color: var(--muted); }
  .mock-big { margin-top: 6px; font-size: clamp(44px, 4.6vw, 68px); font-weight: 700; letter-spacing: -.055em; color: var(--teal); line-height: 1; }
  .mock-big small { font-size: .36em; color: var(--muted); letter-spacing: -.01em; font-weight: 500; margin-left: 6px; }
  .viz { margin-top: 18px; height: 92px; width: 100%; display: block; }
  .mgrid { margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .m { border-radius: 14px; background: #0f1315; border: 1px solid #20272c; padding: 14px 14px 13px; }
  .m .k { font-size: 10.5px; color: var(--dim); }
  .m .v { margin-top: 6px; font-size: 20px; font-weight: 700; letter-spacing: -.03em; }
  .m .v.t { color: var(--teal); }

  /* ---------- Overlay / sheet ---------- */
  .overlay { position: fixed; inset: 0; z-index: 2147483000; }
  .scrim { position: absolute; inset: 0; background: rgba(3,8,9,.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); opacity: 0; }
  .sheet { position: fixed; overflow: hidden; border-radius: 28px; background: radial-gradient(90% 70% at 85% 0%, #0c2725 0%, #07090a 60%), #07090a;
    border: 1px solid #1d2428; box-shadow: 0 50px 120px -20px rgba(0,0,0,.8); display: flex; flex-direction: column; }
  .sheet-inner { display: flex; flex-direction: column; height: 100%; opacity: 0; }
  .bar { position: relative; display: flex; align-items: center; justify-content: space-between; padding: 22px 28px; }
  .bar .logo { height: 22px; }
  .stepno { font-size: 12px; color: var(--muted); }
  .x { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); border: 1px solid var(--line); transition: color .2s, border-color .2s; }
  .x:hover { color: var(--ink); border-color: #3a434a; }
  .prog { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: #161b1e; }
  .prog i { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, var(--teal), var(--blue)); transition: width .45s var(--ease); }
  .stage { position: relative; flex: 1; overflow-y: auto; overscroll-behavior: contain; }
  .step { min-height: 100%; width: 100%; max-width: 980px; margin: 0 auto; padding: clamp(28px, 6vh, 72px) clamp(22px, 5vw, 56px) 40px; display: flex; flex-direction: column; }
  .step.enter { animation: stepIn .42s var(--ease) both; }
  .step.enter-back { animation: stepInBack .42s var(--ease) both; }
  @keyframes stepIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes stepInBack { from { opacity: 0; transform: translateY(-18px); } to { opacity: 1; transform: none; } }
  .q-num { font-size: 13px; color: var(--teal); }
  .q { margin-top: 14px; font-size: clamp(32px, 4.6vw, 60px); font-weight: 700; letter-spacing: -.045em; line-height: 1.04; max-width: 18ch; }
  .hint { margin-top: 14px; font-size: clamp(16px, 1.4vw, 19px); color: var(--muted); max-width: 52ch; }
  .body { margin-top: clamp(26px, 5vh, 48px); }

  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
  .opt { position: relative; text-align: left; display: flex; align-items: center; gap: 14px; min-height: 76px; padding: 16px 46px 16px 18px; border-radius: 16px;
    background: var(--card); border: 1px solid var(--line); transition: border-color .2s, background .2s, transform .15s var(--ease); }
  .opt:hover { border-color: #39424a; transform: translateY(-1px); }
  .opt .ib { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: #171c1f; color: var(--muted); transition: background .2s, color .2s; }
  .opt .lbl { font-size: 17px; font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
  .opt .tick { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #3a434a; display: grid; place-items: center; color: transparent; transition: all .2s; }
  .opt .tick .ic { width: 14px; height: 14px; }
  .opt[aria-pressed="true"] { border-color: var(--teal); background: linear-gradient(180deg, #0f2a28, #0d1b1b); }
  .opt[aria-pressed="true"] .ib { background: var(--teal); color: #031a1c; }
  .opt[aria-pressed="true"] .tick { background: var(--teal); border-color: var(--teal); color: #031a1c; }
  .sel-count { margin-top: 18px; font-size: 13px; color: var(--muted); }
  .sel-count b { color: var(--teal); font-weight: 600; }

  .bignum { display: flex; align-items: baseline; gap: 10px; border-bottom: 2px solid #22292e; padding-bottom: 10px; max-width: 560px; transition: border-color .2s; }
  .bignum:focus-within { border-color: var(--teal); }
  .bignum .pre, .bignum .suf { font-size: clamp(28px, 4vw, 48px); font-weight: 600; color: var(--dim); letter-spacing: -.03em; }
  .bignum input { width: 100%; min-width: 0; background: none; border: 0; outline: none; font-size: clamp(56px, 8vw, 104px); font-weight: 700; letter-spacing: -.055em; line-height: 1; color: var(--ink); caret-color: var(--teal); }
  .bignum input::placeholder { color: #2b3338; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  .range { margin-top: 34px; max-width: 640px; }
  .range input { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; background: transparent; cursor: pointer; }
  .range input::-webkit-slider-runnable-track { height: 6px; border-radius: 6px; background: linear-gradient(90deg, var(--teal) var(--p, 0%), #22292e var(--p, 0%)); }
  .range input::-moz-range-track { height: 6px; border-radius: 6px; background: #22292e; }
  .range input::-moz-range-progress { height: 6px; border-radius: 6px; background: var(--teal); }
  .range input::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; margin-top: -10px; border-radius: 50%; background: #fff; border: 6px solid var(--teal); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
  .range input::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 6px solid var(--teal); }
  .ticks { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--dim); }
  .pills { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 10px; }
  .pill { height: 42px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); font-size: 15px; font-weight: 600; color: #cfd6db; transition: all .2s; }
  .pill:hover { border-color: #39424a; } .pill.on { border-color: var(--teal); color: var(--teal); background: #0f2422; }

  .two { display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; }
  .field { border-radius: 20px; background: var(--card); border: 1px solid var(--line); padding: 22px 24px 24px; }
  .field .fl { font-size: 12px; color: var(--muted); }
  .field .fd { margin-top: 6px; font-size: 14px; color: var(--dim); }
  .field .bignum { margin-top: 16px; border-bottom-width: 1.5px; }
  .field .bignum input { font-size: clamp(44px, 5vw, 68px); }
  .field .bignum .pre { font-size: clamp(24px, 3vw, 36px); }
  .stepper { margin-top: 16px; display: flex; align-items: center; gap: 18px; }
  .stepper button { width: 54px; height: 54px; border-radius: 16px; border: 1px solid var(--line); background: #0d1012; font-size: 26px; font-weight: 500; color: var(--ink); transition: border-color .2s; }
  .stepper button:hover { border-color: var(--teal); }
  .stepper output { min-width: 2ch; text-align: center; font-size: clamp(44px, 5vw, 68px); font-weight: 700; letter-spacing: -.05em; }

  .nav { position: relative; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 28px 22px; border-top: 1px solid #13181b; }
  .back { display: inline-flex; align-items: center; gap: 8px; height: 52px; padding: 0 16px 0 10px; border-radius: 14px; color: var(--muted); font-size: 16px; font-weight: 600; transition: color .2s; }
  .back:hover { color: var(--ink); } .back[hidden] { display: inline-flex; visibility: hidden; }
  .next { display: inline-flex; align-items: center; gap: 10px; height: 56px; padding: 0 28px; border-radius: 16px; background: var(--teal); color: #031a1c; font-size: 17px; font-weight: 700; transition: opacity .2s, transform .2s var(--ease); }
  .next:hover { transform: translateY(-1px); }
  .next:disabled { opacity: .35; cursor: not-allowed; transform: none; }
  .kbd { font-size: 12px; color: var(--dim); }

  /* ---------- Results ---------- */
  .res-head { font-size: clamp(30px, 4.2vw, 54px); font-weight: 700; letter-spacing: -.045em; line-height: 1.05; max-width: 22ch; }
  .res-head em { font-style: normal; color: var(--teal); }
  .hero { margin-top: 30px; display: grid; grid-template-columns: 1.25fr 1fr; gap: 16px; }
  .hcard { position: relative; overflow: hidden; border-radius: 24px; padding: 30px 32px; background: linear-gradient(160deg, #0f2e2b 0%, #0b1717 60%, #0a1113 100%); border: 1px solid var(--line2); }
  .hcard .k { font-size: 12px; color: #8fb5b0; }
  .hcard .big { margin-top: 10px; white-space: nowrap; font-size: clamp(56px, 6.6vw, 100px); font-weight: 700; letter-spacing: -.06em; line-height: .92; color: var(--teal); font-variant-numeric: tabular-nums; }
  .hcard .big small { font-size: .26em; letter-spacing: -.01em; color: #8fb5b0; font-weight: 500; margin-left: 8px; }
  .comp { margin-top: 26px; height: 12px; border-radius: 8px; display: flex; overflow: hidden; background: #0b1314; gap: 3px; }
  .comp i { display: block; height: 100%; transition: flex-grow .8s var(--ease); }
  .legend { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; color: #b6c9c6; }
  .legend span { display: inline-flex; align-items: center; gap: 8px; }
  .legend b { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  .plan { border-radius: 24px; padding: 26px 28px; background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; }
  .plan .k { font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; gap: 10px; }
  .plan .k i { font-style: normal; color: #c9a45c; letter-spacing: .1em; }
  .plan .pn { margin-top: 10px; font-size: 40px; font-weight: 700; letter-spacing: -.04em; }
  .plan .pp { font-size: 18px; color: var(--muted); margin-top: 2px; }
  .plan .net { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--line); }
  .plan .net .k { color: var(--muted); }
  .plan .net .nv { margin-top: 6px; font-size: 40px; font-weight: 700; letter-spacing: -.045em; font-variant-numeric: tabular-nums; }
  .plan .net .nv.pos { color: var(--ink); } .plan .net .nv.neg { color: #e8a0a0; }
  .plan .fm { margin-top: 6px; font-size: 13px; color: var(--dim); }

  .rgrid { margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .rc { border-radius: 20px; padding: 22px 24px; background: var(--card); border: 1px solid var(--line); }
  .rc .k { font-size: 11.5px; color: var(--muted); }
  .rc .v { margin-top: 8px; font-size: 32px; font-weight: 700; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
  .rc .d { margin-top: 6px; font-size: 14px; color: var(--dim); line-height: 1.4; }
  .rc.ctx .v { color: #aeb6bd; }
  .note { margin-top: 10px; font-size: 13px; color: #c9a45c; }

  .acts { margin-top: 28px; }
  .acts h3 { font-size: 13px; color: var(--muted); font-weight: 400; }
  .acts ul { list-style: none; margin-top: 12px; display: flex; flex-wrap: wrap; gap: 10px; }
  .acts li { display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 16px 0 12px; border-radius: 12px; background: #0f2422; border: 1px solid var(--line2); font-size: 15px; font-weight: 600; color: #dff7f3; }
  .acts li .ic { width: 18px; height: 18px; color: var(--teal); }

  details { margin-top: 24px; border-radius: 18px; border: 1px solid var(--line); background: #0c0f11; }
  summary { list-style: none; cursor: pointer; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: #cfd6db; }
  summary::-webkit-details-marker { display: none; }
  summary::after { content: "+"; font-size: 22px; color: var(--muted); transition: transform .2s; }
  details[open] summary::after { transform: rotate(45deg); }
  .how { padding: 0 22px 22px; }
  .how p { font-size: 14px; color: var(--muted); line-height: 1.55; max-width: 80ch; }
  .assm { margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .as { border-radius: 14px; border: 1px solid var(--line); padding: 14px 16px; background: var(--card); }
  .as label { font-size: 13px; color: #cfd6db; font-weight: 600; display: block; }
  .as small { display: block; margin-top: 4px; font-size: 12px; color: var(--dim); line-height: 1.4; }
  .as .row { margin-top: 10px; display: flex; align-items: center; gap: 10px; }
  .as input[type=range] { flex: 1; accent-color: var(--teal); }
  .as output { min-width: 3.4ch; text-align: right; font-weight: 700; color: var(--teal); }
  .reset { margin-top: 14px; font-size: 13px; color: var(--teal); font-weight: 600; }
  .formula { margin-top: 14px; font-size: 13px; color: var(--dim); line-height: 1.7; }
  .formula code { font-family: inherit; color: #b0b9c0; }

  .final { margin-top: 30px; border-radius: 24px; padding: 32px; display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
    background: linear-gradient(110deg, #10302d 0%, #0c1c1c 55%, #0b1a24 100%); border: 1.5px solid var(--teal); }
  .final h3 { font-size: clamp(24px, 2.6vw, 34px); font-weight: 700; letter-spacing: -.035em; line-height: 1.1; max-width: 22ch; }
  .final h3 span { color: var(--teal); }
  .capture { flex: 1 1 520px; max-width: 640px; }
  .cl { display: block; font-size: 12px; color: #8fb5b0; margin-bottom: 12px; }
  .crow { display: flex; gap: 12px; flex-wrap: wrap; }
  .crow input { flex: 1 1 240px; min-width: 0; height: 64px; padding: 0 20px; border-radius: 16px; background: #071112; border: 1px solid #2a5a55; font-size: 18px; outline: none; transition: border-color .2s; }
  .crow input:focus { border-color: var(--teal); }
  .crow input::placeholder { color: #4d6663; }
  .crow .cta:disabled { opacity: .5; cursor: default; transform: none; }
  .cerr { margin-top: 10px; font-size: 14px; color: #f0a8a8; }
  .disc { margin-top: 18px; font-size: 12px; color: var(--dim); line-height: 1.5; }
  .done { margin-top: 14px; font-size: 15px; color: var(--teal); font-weight: 600; }

  @media (max-width: 900px) {
    .panel { grid-template-columns: 1fr; padding: 36px 24px; gap: 34px; border-radius: 26px; }
    .mgrid { grid-template-columns: 1fr 1fr; } .mgrid .m:last-child { grid-column: span 2; }
    .hero, .rgrid, .two, .assm { grid-template-columns: 1fr; }
    .bar { padding: 16px 18px; } .nav { padding: 14px 18px 18px; } .kbd { display: none; }
    .cards { grid-template-columns: 1fr; } .opt { min-height: 64px; }
    .crow .cta { width: 100%; justify-content: center; font-size: 17px; white-space: nowrap; padding: 0 18px; } .final { padding: 26px 22px; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
  `;

  /* ------------------------------------------------------------------ *
   * 5. COMPONENT
   * ------------------------------------------------------------------ */
  const STEPS = 5;
  const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  class OloCalculator extends HTMLElement {
    constructor() {
      super();
      this.state = { step: 1, activities: [], weeklyHours: 15, missedOpportunities: 10, profitPerCustomer: "", adminEmployees: 1, monthlyCostPerEmployee: "" };
      this.assumptions = { ...CONFIG.assumptions };
      this.root = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      const h = this.getAttribute("headline") || "What's olo worth to your business?";
      const s = this.getAttribute("subheading") || "Five quick questions. Find out what you could get back.";
      const c = this.getAttribute("cta") || "Calculate My Savings";
      const S = CONFIG.sample;
      const hl = esc(h).replace(/olo/, "<em>olo</em>");
      this.root.innerHTML = `<style>${CSS}</style>
      <div class="root">
        <section class="panel" part="panel">
          <div>
            <div class="eyebrow mono">olo savings calculator</div>
            <h2 class="h1">${hl}</h2>
            <p class="sub">${esc(s)}</p>
            <button class="cta" type="button">${esc(c)} <span class="arr">→</span></button>
            <div class="meta mono">≈ 60 seconds · No signup required</div>
          </div>
          <div class="mock" aria-hidden="true">
            <div class="mock-top">${LOGO}<span class="chip mono">Sample estimate</span></div>
            <div class="mock-label mono">Estimated monthly benefit</div>
            <div class="mock-big">${money(S.benefit)}<small>/mo</small></div>
            ${this.vizSVG()}
            <div class="mgrid">
              <div class="m"><div class="k mono">Time value</div><div class="v">${money(S.time)}</div></div>
              <div class="m"><div class="k mono">Customer profit</div><div class="v">${money(S.profit)}</div></div>
              <div class="m"><div class="k mono">Plan</div><div class="v t">${S.plan}</div></div>
            </div>
          </div>
        </section>
      </div>`;
      this.panel = this.root.querySelector(".panel");
      this.root.querySelector(".cta").addEventListener("click", () => this.open());
    }

    vizSVG() {
      // recovered-time bars + rising profit line (decorative)
      const bars = [18, 26, 22, 34, 30, 42, 38, 50, 47, 58, 62, 70];
      const w = 300, h = 92, bw = 16, gap = (w - bars.length * bw) / (bars.length - 1);
      let b = "", pts = [];
      bars.forEach((v, i) => {
        const x = i * (bw + gap), y = h - v;
        b += `<rect x="${x.toFixed(1)}" y="${y}" width="${bw}" height="${v}" rx="4" fill="${i > 7 ? "#2ff0d4" : "#1d3533"}"/>`;
        pts.push([x + bw / 2, Math.max(6, h - v - 12 - i * 0.8)]);
      });
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      return `<svg class="viz" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${b}<path d="${d}" fill="none" stroke="#0aa8ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" fill="#0aa8ff"/></svg>`;
    }

    /* ---------- open / close with spatial transition ---------- */
    targetRect() {
      const vw = window.innerWidth, vh = window.innerHeight, m = vw < 700 ? 0 : 20;
      return { top: m, left: m, width: vw - 2 * m, height: vh - 2 * m, radius: vw < 700 ? 0 : 28 };
    }

    open() {
      if (this.overlay) return;
      this.lastFocus = document.activeElement;
      const host = document.createElement("div");
      host.setAttribute("data-olo-calculator-overlay", "");
      document.body.appendChild(host);
      const sr = host.attachShadow({ mode: "open" });
      sr.innerHTML = `<style>${CSS}</style>
        <div class="root overlay" role="dialog" aria-modal="true" aria-label="olo savings calculator">
          <div class="scrim"></div>
          <div class="sheet">
            <div class="sheet-inner">
              <div class="bar">${LOGO}<span class="stepno mono"></span><button class="x" type="button" aria-label="Close calculator">${icon("close")}</button><div class="prog"><i></i></div></div>
              <div class="stage"></div>
              <div class="nav"><button class="back" type="button">${icon("back")} Back</button><span class="kbd mono">Press Enter ↵</span><button class="next" type="button">Continue <span>→</span></button></div>
            </div>
          </div>
        </div>`;
      this.portal = host; this.sr = sr;
      this.overlay = sr.querySelector(".overlay");
      this.sheet = sr.querySelector(".sheet");
      this.inner = sr.querySelector(".sheet-inner");
      this.stage = sr.querySelector(".stage");
      this.btnNext = sr.querySelector(".next");
      this.btnBack = sr.querySelector(".back");
      sr.querySelector(".x").addEventListener("click", () => this.close());
      sr.querySelector(".scrim").addEventListener("click", () => this.close());
      this.btnNext.addEventListener("click", () => this.next());
      this.btnBack.addEventListener("click", () => this.back());
      this.onKey = (e) => {
        if (e.key === "Escape") this.close();
        else if (e.key === "Enter" && this.state.step <= STEPS && !(e.target && e.target.tagName === "BUTTON")) { e.preventDefault(); this.next(); }
        else if (e.key === "Tab") this.trapFocus(e);
      };
      document.addEventListener("keydown", this.onKey, true);
      this.onResize = () => { const t = this.targetRect(); Object.assign(this.sheet.style, { top: t.top + "px", left: t.left + "px", width: t.width + "px", height: t.height + "px", borderRadius: t.radius + "px" }); };
      this.prevOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";

      this.state.step = 1;
      this.render(1);

      const from = this.panel.getBoundingClientRect(), to = this.targetRect();
      const dur = reduceMotion() ? 1 : 380, ease = "cubic-bezier(.2,.8,.2,1)";
      Object.assign(this.sheet.style, { top: to.top + "px", left: to.left + "px", width: to.width + "px", height: to.height + "px", borderRadius: to.radius + "px" });
      const kf = [
        { top: from.top + "px", left: from.left + "px", width: from.width + "px", height: from.height + "px", borderRadius: "32px" },
        { top: to.top + "px", left: to.left + "px", width: to.width + "px", height: to.height + "px", borderRadius: to.radius + "px" },
      ];
      this.sheet.animate(kf, { duration: dur, easing: ease });
      sr.querySelector(".scrim").animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, easing: ease, fill: "forwards" });
      this.panel.animate([{ opacity: 1 }, { opacity: 0.0 }], { duration: dur * 0.6, fill: "forwards" });
      this.inner.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: dur * 0.7, delay: dur * 0.55, easing: ease, fill: "forwards" })
        .finished.then(() => { const f = this.stage.querySelector("input, .opt"); f && f.focus({ preventScroll: true }); });
      window.addEventListener("resize", this.onResize);
    }

    close() {
      if (!this.overlay || this.closing) return;
      this.closing = true;
      const from = this.sheet.getBoundingClientRect(), to = this.panel.getBoundingClientRect();
      const dur = reduceMotion() ? 1 : 320, ease = "cubic-bezier(.4,0,.2,1)";
      this.inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur * 0.4, fill: "forwards" });
      this.sr.querySelector(".scrim").animate([{ opacity: 1 }, { opacity: 0 }], { duration: dur, easing: ease, fill: "forwards" });
      this.panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: dur * 0.5, fill: "forwards" });
      this.sheet.animate([
        { top: from.top + "px", left: from.left + "px", width: from.width + "px", height: from.height + "px" },
        { top: to.top + "px", left: to.left + "px", width: to.width + "px", height: to.height + "px", borderRadius: "32px" },
      ], { duration: dur, easing: ease, fill: "forwards" }).finished.then(() => {
        document.removeEventListener("keydown", this.onKey, true);
        window.removeEventListener("resize", this.onResize);
        document.documentElement.style.overflow = this.prevOverflow || "";
        this.portal.remove();
        this.overlay = this.portal = this.sr = null; this.closing = false;
        this.panel.getAnimations().forEach((a) => a.cancel());
        this.lastFocus && this.lastFocus.focus && this.lastFocus.focus({ preventScroll: true });
      });
    }

    trapFocus(e) {
      const f = [...this.sr.querySelectorAll("button, input, summary, [tabindex]")].filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const a = this.sr.activeElement, first = f[0], last = f[f.length - 1];
      if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    }

    /* ---------- navigation ---------- */
    next() {
      if (this.state.step > STEPS) return;
      if (!this.valid()) return;
      this.state.step++;
      this.render(1);
    }
    back() { if (this.state.step > 1) { this.state.step--; this.render(-1); } }
    valid() { return this.state.step !== 1 || this.state.activities.length > 0; }

    render(dir) {
      const st = this.state, n = st.step, isRes = n > STEPS;
      this.sr.querySelector(".prog i").style.width = (isRes ? 100 : ((n - 1) / STEPS) * 100 + 6) + "%";
      this.sr.querySelector(".stepno").textContent = isRes ? "Your estimate" : `Question ${n} of ${STEPS}`;
      this.btnBack.hidden = n === 1;
      this.sr.querySelector(".nav").style.display = isRes ? "none" : "";
      this.btnNext.innerHTML = n === STEPS ? "See my results <span>→</span>" : "Continue <span>→</span>";

      const el = document.createElement("div");
      el.className = "step " + (dir < 0 ? "enter-back" : "enter");
      el.innerHTML = isRes ? this.resultsHTML() : this["step" + n]();
      this.stage.replaceChildren(el);
      this.stage.scrollTop = 0;
      this["bind" + (isRes ? "Results" : n)](el);
      this.updateNext();
      if (!isRes) { const f = el.querySelector("input"); f && setTimeout(() => f.focus({ preventScroll: true }), 60); }
    }
    updateNext() { this.btnNext.disabled = !this.valid(); }
    header(n, q, hint) { return `<div class="q-num mono">0${n} / 0${STEPS}</div><h2 class="q">${q}</h2>${hint ? `<p class="hint">${hint}</p>` : ""}`; }

    /* ---------- steps ---------- */
    step1() {
      const opts = CONFIG.activities.map((a) => `<button type="button" class="opt" data-id="${a.id}" aria-pressed="${this.state.activities.includes(a.id)}"><span class="ib">${icon(a.icon)}</span><span class="lbl">${a.label}</span><span class="tick">${icon("check")}</span></button>`).join("");
      return this.header(1, "What's eating up your workweek?", "Select everything that takes your team's time.") + `<div class="body"><div class="cards">${opts}</div><div class="sel-count"></div></div>`;
    }
    bind1(el) {
      const count = el.querySelector(".sel-count");
      const upd = () => { const k = this.state.activities.length; count.innerHTML = k ? `<b>${k}</b> selected` : "Choose at least one to continue"; this.updateNext(); };
      el.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.id, A = this.state.activities, i = A.indexOf(id);
        i >= 0 ? A.splice(i, 1) : A.push(id);
        b.setAttribute("aria-pressed", i < 0); upd();
      }));
      upd();
    }

    rangeBlock(key, max, step, ticks) {
      return `<div class="range"><input type="range" min="0" max="${max}" step="${step}" aria-label="Adjust" data-k="${key}"><div class="ticks mono">${ticks.map((t) => `<span>${t}</span>`).join("")}</div></div>`;
    }
    bindRange(el, key, max) {
      const inp = el.querySelector(".bignum input"), r = el.querySelector(".range input");
      const sync = (v, from) => {
        this.state[key] = v;
        const n = num(v);
        if (from !== "r") r.value = Math.min(n, max);
        if (from !== "i") inp.value = v;
        r.style.setProperty("--p", (Math.min(n, max) / max) * 100 + "%");
      };
      inp.addEventListener("input", () => sync(inp.value.replace(/[^0-9.]/g, ""), "i"));
      r.addEventListener("input", () => sync(r.value, "r"));
      sync(this.state[key], null);
    }

    step2() { return this.header(2, "How much time does all that take each week?", "Total hours across your team for the work you selected.") + `<div class="body"><label class="bignum"><input type="number" inputmode="decimal" min="0" placeholder="0" aria-label="Weekly hours"><span class="suf">hrs / week</span></label>${this.rangeBlock("weeklyHours", 80, 1, ["0", "20", "40", "60", "80+"])}</div>`; }
    bind2(el) { this.bindRange(el, "weeklyHours", 80); }

    step3() { return this.header(3, "How many potential customers slip through the cracks each month?", "Missed calls, neglected leads, unanswered quotes, lost opportunities. Your best guess is fine.") + `<div class="body"><label class="bignum"><input type="number" inputmode="numeric" min="0" placeholder="0" aria-label="Missed opportunities per month"><span class="suf">/ month</span></label>${this.rangeBlock("missedOpportunities", 100, 1, ["0", "25", "50", "75", "100+"])}</div>`; }
    bind3(el) { this.bindRange(el, "missedOpportunities", 100); }

    step4() {
      const presets = [250, 500, 1000, 2500, 5000];
      return this.header(4, "What's an average customer worth to your business?", "Average <b style='color:#fff'>profit</b> per customer, not total revenue.") +
        `<div class="body"><label class="bignum"><span class="pre">$</span><input type="number" inputmode="decimal" min="0" placeholder="0" aria-label="Average profit per customer"></label><div class="pills">${presets.map((p) => `<button type="button" class="pill" data-v="${p}">${money(p)}</button>`).join("")}</div></div>`;
    }
    bind4(el) {
      const inp = el.querySelector("input"), pills = el.querySelectorAll(".pill");
      const mark = () => pills.forEach((p) => p.classList.toggle("on", num(inp.value) === +p.dataset.v));
      inp.value = this.state.profitPerCustomer;
      inp.addEventListener("input", () => { this.state.profitPerCustomer = inp.value; mark(); });
      pills.forEach((p) => p.addEventListener("click", () => { inp.value = p.dataset.v; this.state.profitPerCustomer = p.dataset.v; mark(); inp.focus(); }));
      mark();
    }

    step5() {
      return this.header(5, "How much are you spending on administrative staff?", "People mainly doing admin or other non-revenue work, and what each costs you per month including benefits.") +
        `<div class="body two">
          <div class="field"><div class="fl mono">Admin employees</div><div class="fd">Full-time equivalents</div>
            <div class="stepper"><button type="button" data-d="-1" aria-label="Fewer">−</button><output aria-live="polite"></output><button type="button" data-d="1" aria-label="More">+</button></div></div>
          <div class="field"><div class="fl mono">Monthly cost per employee</div><div class="fd">Wages + benefits</div>
            <label class="bignum"><span class="pre">$</span><input type="number" inputmode="decimal" min="0" placeholder="0" aria-label="Average monthly cost per employee"></label></div>
        </div>`;
    }
    bind5(el) {
      const out = el.querySelector("output"), inp = el.querySelector("input");
      const show = () => (out.textContent = this.state.adminEmployees);
      el.querySelectorAll(".stepper button").forEach((b) => b.addEventListener("click", () => {
        this.state.adminEmployees = Math.max(0, Math.min(50, num(this.state.adminEmployees) + +b.dataset.d)); show();
      }));
      inp.value = this.state.monthlyCostPerEmployee;
      inp.addEventListener("input", () => (this.state.monthlyCostPerEmployee = inp.value));
      show();
    }

    /* ---------- results ---------- */
    resultsHTML() {
      const r = compute(this.state, this.assumptions);
      const acts = CONFIG.activities.filter((a) => this.state.activities.includes(a.id));
      const a = this.assumptions;
      const sl = (k, label, desc, min, max) => `<div class="as"><label for="as-${k}">${label}</label><small>${desc}</small><div class="row"><input id="as-${k}" type="range" min="${min}" max="${max}" step="1" value="${Math.round(a[k] * 100)}" data-a="${k}"><output>${pct(a[k])}</output></div></div>`;
      return `
        <div class="q-num mono">Your estimate</div>
        <h2 class="res-head" style="margin-top:14px">Here's what <em>olo</em> could give back to your business.</h2>
        <div class="hero">
          <div class="hcard">
            <div class="k mono">Estimated monthly benefit</div>
            <div class="big" data-count="${r.monthlyBenefit}">${money(r.monthlyBenefit)}<small>/mo</small></div>
            <div class="comp">${this.compBars(r)}</div>
            <div class="legend"><span><b style="background:#2ff0d4"></b>Time value recovered</span><span><b style="background:#0aa8ff"></b>Customer profit</span></div>
          </div>
          <div class="plan">
            <div class="k mono"><span>Recommended plan</span><i>Preliminary</i></div>
            <div class="pn">${r.plan ? r.plan.name : "—"}</div>
            <div class="pp">${r.plan ? money(r.plan.price) + " / month" : ""}</div>
            <div class="net">
              <div class="k mono">Estimated net monthly benefit</div>
              <div class="nv ${r.netMonthly >= 0 ? "pos" : "neg"}">${money(r.netMonthly)}<span style="font-size:.45em;color:var(--muted);font-weight:500"> /mo</span></div>
              <div class="fm">First month: ${money(r.firstMonthNet)} after the ${money(CONFIG.constants.setupFee)} one-time setup.</div>
            </div>
          </div>
        </div>
        <div class="rgrid">
          <div class="rc"><div class="k mono">Admin time value recovered</div><div class="v">${money(r.timeValueRecovered)}</div><div class="d">${pct(a.automationRate)} of ${money(r.monthlyTimeValue)} in monthly admin time.</div>${r.flags.noCost ? '<div class="note">Add a monthly employment cost to value this time.</div>' : ""}</div>
          <div class="rc"><div class="k mono">Additional customer profit</div><div class="v">${money(r.customerProfit)}</div><div class="d">≈ ${r.customersRecovered.toFixed(1)} recovered customers per month.</div>${r.flags.noProfit ? '<div class="note">Add a profit per customer to value recovered leads.</div>' : ""}</div>
          <div class="rc ctx"><div class="k mono">Current admin payroll</div><div class="v">${money(r.adminPayroll)}</div><div class="d">For context only. olo doesn't replace your people.</div></div>
        </div>
        ${acts.length ? `<div class="acts"><h3 class="mono">What olo could take off your plate</h3><ul>${acts.map((x) => `<li>${icon(x.icon)}${x.label}</li>`).join("")}</ul></div>` : ""}
        <details>
          <summary>How we calculated this</summary>
          <div class="how">
            <p>Everything here is an estimate, not a guarantee. Recovered time is economic value (hours your team gets back), not necessarily cash saved, and we never assume olo removes staff or salaries. Admin payroll is shown for context and is not added to your benefit. Adjust any assumption to recalculate.</p>
            <div class="assm">
              ${sl("automationRate", "Admin work olo handles", "Share of weekly admin time automated", 0, 100)}
              ${sl("recoveryRate", "Opportunities recovered", "Missed opportunities won back by better follow-up", 0, 100)}
              ${sl("conversionRate", "Recovered → customers", "Recovered opportunities that become paying customers", 0, 100)}
            </div>
            <button type="button" class="reset">Reset to defaults</button>
            <div class="formula">
              <code>Hourly cost = monthly cost per employee ÷ ${CONFIG.constants.hoursPerMonth}</code><br>
              <code>Time value recovered = weekly hours × ${CONFIG.constants.weeksPerMonth} × hourly cost × ${pct(a.automationRate)}</code><br>
              <code>Customer profit = missed opportunities × ${pct(a.recoveryRate)} × ${pct(a.conversionRate)} × profit per customer</code><br>
              <code>Net monthly benefit = monthly benefit − plan price</code>
            </div>
          </div>
        </details>
        <div class="final">
          <h3>Your business has better things to do. <span>Let olo handle them.</span></h3>
          <form class="capture" novalidate>
            <label class="cl mono" for="olo-email">Get early access</label>
            <div class="crow"><input id="olo-email" type="email" inputmode="email" autocomplete="email" placeholder="you@yourbusiness.com" required>
            <button class="cta apply" type="submit" style="margin-top:0">Apply for Early Access <span class="arr">→</span></button></div>
            <div class="cerr" hidden>Enter a valid email address.</div>
          </form>
        </div>
        <div class="done" hidden>Thanks. We'll be in touch soon.</div>
        <p class="disc">Estimates only, based on your inputs and the assumptions above. Not a guarantee of savings or revenue. Plan recommendation is preliminary and doesn't account for seat requirements.</p>
        <p style="margin-top:22px"><button type="button" class="back restart">${icon("back")} Edit my answers</button></p>`;
    }
    compBars(r) {
      const t = Math.max(r.timeValueRecovered, 0), p = Math.max(r.customerProfit, 0);
      if (t + p === 0) return `<i style="flex:1;background:#1a2a29"></i>`;
      return `<i style="flex:${t};background:#2ff0d4"></i><i style="flex:${p};background:#0aa8ff"></i>`;
    }

    bindResults(el) {
      // count-up on the hero figure
      const big = el.querySelector(".big"), target = +big.dataset.count;
      if (!reduceMotion() && target > 0) {
        const t0 = performance.now(), d = 900;
        const tick = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); big.firstChild.nodeValue = money(target * e); if (k < 1) requestAnimationFrame(tick); };
        big.firstChild.nodeValue = "$0"; requestAnimationFrame(tick);
      }
      el.querySelectorAll("[data-a]").forEach((s) => s.addEventListener("input", () => {
        this.assumptions[s.dataset.a] = +s.value / 100; this.refreshResults(el);
      }));
      el.querySelector(".reset").addEventListener("click", () => { this.assumptions = { ...CONFIG.assumptions }; this.refreshResults(el, true); });
      el.querySelector(".restart").addEventListener("click", () => { this.state.step = 1; this.render(-1); });
      el.querySelector(".capture").addEventListener("submit", (e) => { e.preventDefault(); this.apply(el); });
      el.querySelector("#olo-email").addEventListener("input", () => (el.querySelector(".cerr").hidden = true));
    }
    refreshResults(el, resetSliders) {
      // re-render results in place while keeping the details panel open and scroll position
      const scroll = this.stage.scrollTop;
      el.innerHTML = this.resultsHTML();
      el.className = "step";
      el.querySelector("details").open = true;
      this.bindResults(el);
      const big = el.querySelector(".big"); big.firstChild.nodeValue = money(+big.dataset.count);
      this.stage.scrollTop = scroll;
    }

    apply(el) {
      const inp = el.querySelector("#olo-email"), err = el.querySelector(".cerr"), btn = el.querySelector(".apply"), done = el.querySelector(".done");
      const email = inp.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.hidden = false; inp.focus(); return; }
      err.hidden = true;
      const r = compute(this.state, this.assumptions);
      const labels = CONFIG.activities.filter((x) => this.state.activities.includes(x.id)).map((x) => x.label);
      const payload = {
        email, source: "olo-calculator",
        inputs: { activities: labels, weeklyHours: num(this.state.weeklyHours), missedOpportunities: num(this.state.missedOpportunities),
                  profitPerCustomer: num(this.state.profitPerCustomer), adminEmployees: num(this.state.adminEmployees), monthlyCostPerEmployee: num(this.state.monthlyCostPerEmployee) },
        assumptions: { ...this.assumptions },
        results: {
          monthlyBenefit: Math.round(r.monthlyBenefit), timeValueRecovered: Math.round(r.timeValueRecovered),
          customerProfit: Math.round(r.customerProfit), adminPayroll: Math.round(r.adminPayroll),
          recommendedPlan: r.plan && r.plan.name, planPrice: r.subscription,
          netMonthlyBenefit: Math.round(r.netMonthly), firstMonthNet: Math.round(r.firstMonthNet),
        },
      };
      this.dispatchEvent(new CustomEvent("olo:apply", { detail: payload, bubbles: true, composed: true }));
      const api = window.OloCalculator || {};
      const cfg = { contactEmail: api.contactEmail || CONFIG.contactEmail, formEndpoint: api.formEndpoint || CONFIG.formEndpoint };
      const finish = (msg) => { done.textContent = msg; done.hidden = false; btn.disabled = true; inp.disabled = true; };

      if (typeof api.onApply === "function") {
        const fail = () => { btn.disabled = false; err.textContent = "Something went wrong. Please try again."; err.hidden = false; };
        btn.disabled = true;
        Promise.resolve().then(() => api.onApply(payload))
          .then((res) => (res === false ? fail() : finish("You're on the list. We'll be in touch soon.")))
          .catch(fail);
      } else if (cfg.formEndpoint) {
        btn.disabled = true;
        fetch(cfg.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email, _subject: "olo early access: " + email, ...payload.results, activities: labels.join(", "), inputs: JSON.stringify(payload.inputs) }) })
          .then((res) => { if (!res.ok) throw 0; finish("You're on the list. We'll be in touch soon."); })
          .catch(() => { btn.disabled = false; err.textContent = "Something went wrong. Please try again."; err.hidden = false; });
      } else if (cfg.contactEmail) {
        const R = payload.results, I = payload.inputs;
        const body = [
          "I'd like early access to olo.", "", "Email: " + email, "",
          "My calculator estimate:",
          "- Estimated monthly benefit: " + money(R.monthlyBenefit),
          "- Admin time value recovered: " + money(R.timeValueRecovered),
          "- Additional customer profit: " + money(R.customerProfit),
          "- Recommended plan: " + (R.recommendedPlan || "-") + " (" + money(R.planPrice) + "/mo)",
          "- Estimated net monthly benefit: " + money(R.netMonthlyBenefit),
          "", "My answers:",
          "- Work to automate: " + (I.activities.join(", ") || "-"),
          "- Weekly admin hours: " + I.weeklyHours,
          "- Missed opportunities / month: " + I.missedOpportunities,
          "- Profit per customer: " + money(I.profitPerCustomer),
          "- Admin staff: " + I.adminEmployees + " at " + money(I.monthlyCostPerEmployee) + "/mo",
        ].join("\n");
        location.href = "mailto:" + cfg.contactEmail + "?subject=" + encodeURIComponent("olo early access: " + email) + "&body=" + encodeURIComponent(body);
        finish("Your email app should open with everything filled in. Just hit send.");
      }
    }
  }

  if (!customElements.get("olo-calculator")) customElements.define("olo-calculator", OloCalculator);
  window.OloCalculator = Object.assign(window.OloCalculator || {}, { CONFIG, compute, recommendPlan });
})();
