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
    const hourlyCost = cost > 0 ? cost / c.hoursPerMonth : 0;   // hourly value of one admin employee's time
    const hoursRecovered = hours * c.weeksPerMonth * a.automationRate;   // monthly admin capacity returned
    const capacityValue = hoursRecovered * hourlyCost;              // value of redirected employee capacity
    const monthlyTimeValue = hours * c.weeksPerMonth * hourlyCost;  // (for the formula note)
    const timeValueRecovered = capacityValue;                        // alias kept for compatibility

    const customersRecovered = missed * a.recoveryRate * a.conversionRate;
    const customerProfit = customersRecovered * profit;

    const monthlyBenefit = timeValueRecovered + customerProfit;
    const plan = recommendPlan((inputs.activities || []).length);
    const subscription = plan ? plan.price : 0;
    const netMonthly = monthlyBenefit - subscription;
    const firstMonthNet = netMonthly - c.setupFee;

    return {
      hourlyCost, hoursRecovered, capacityValue, monthlyTimeValue, timeValueRecovered, customersRecovered, customerProfit,
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
  .panel { position: relative; overflow: hidden; max-width: 1280px; margin: 0 auto; border-radius: 32px; background: radial-gradient(120% 90% at 85% 0%, #0d2a28 0%, #090b0c 55%) , var(--bg);
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
  .viz { margin-top: 18px; width: 100%; height: auto; aspect-ratio: 300 / 92; display: block; overflow: visible; }
  .viz rect { transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(.08); transition: transform .9s var(--ease); transition-delay: calc(var(--i) * 45ms); }
  .viz path { stroke-dasharray: 600; stroke-dashoffset: 600; transition: stroke-dashoffset 1.4s var(--ease) .35s; }
  .viz circle { opacity: 0; transition: opacity .4s 1.4s; }
  .panel.in .viz rect { transform: none; } .panel.in .viz path { stroke-dashoffset: 0; } .panel.in .viz circle { opacity: 1; }
  .panel::after { content: ""; position: absolute; width: 520px; height: 520px; right: -140px; top: -220px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(47,240,212,.16), transparent 65%); }
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
  .main { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 400px; }
  .main.full { grid-template-columns: minmax(0, 1fr); } .main.full .live { display: none; }
  .stage { position: relative; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
  .live { position: relative; padding: 28px 28px 28px 0; display: flex; }
  .lv-card { position: relative; overflow: hidden; flex: 1; border-radius: 24px; padding: 28px; display: flex; flex-direction: column;
    background: linear-gradient(170deg, #0f2a28 0%, #0b1516 55%, #0a0f11 100%); border: 1px solid var(--line2); box-shadow: 0 30px 80px -30px rgba(47,240,212,.25); }
  .lv-card::before { content: ""; position: absolute; width: 380px; height: 380px; left: -120px; bottom: -160px; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, rgba(10,168,255,.18), transparent 65%); animation: drift 9s ease-in-out infinite alternate; }
  @keyframes drift { to { transform: translate(90px, -60px); } }
  .lv-top { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #8fb5b0; }
  .lv-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 0 rgba(47,240,212,.6); animation: ping 2s infinite; }
  @keyframes ping { 70% { box-shadow: 0 0 0 10px rgba(47,240,212,0); } 100% { box-shadow: 0 0 0 0 rgba(47,240,212,0); } }
  .lv-k { margin-top: 34px; font-size: 11px; color: #8fb5b0; }
  .lv-big { margin-top: 10px; font-size: 64px; font-weight: 700; letter-spacing: -.055em; line-height: 1; color: var(--teal); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .lv-big small { font-size: 20px; letter-spacing: 0; color: #8fb5b0; font-weight: 500; margin-left: 6px; }
  .lv-yr { margin-top: 8px; font-size: 14px; color: #8fb5b0; } .lv-yr b { color: #dff7f3; font-variant-numeric: tabular-nums; }
  .lv-hrs { margin-top: 26px; padding: 18px 20px; border-radius: 16px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.06); display: flex; align-items: center; justify-content: space-between; }
  .lv-hrs > div { display: flex; align-items: center; gap: 14px; }
  .lv-hrs b { font-size: 40px; font-weight: 700; letter-spacing: -.04em; line-height: 1; font-variant-numeric: tabular-nums; }
  .lv-hrs span { font-size: 13px; color: #8fb5b0; line-height: 1.3; }
  .lv-ring { width: 48px; height: 48px; } .lv-rc { transition: stroke-dashoffset .8s var(--ease); }
  .lv-row { margin-top: 26px; }
  .lv-row + .lv-row { margin-top: 16px; }
  .lv-l { display: flex; justify-content: space-between; font-size: 14px; color: #b6c9c6; }
  .lv-l b { color: #fff; font-variant-numeric: tabular-nums; }
  .lv-bar { margin-top: 8px; height: 6px; border-radius: 6px; background: rgba(255,255,255,.06); overflow: hidden; }
  .lv-bar i { display: block; height: 100%; width: 0; border-radius: 6px; transition: width .6s var(--ease); }
  .lv-plan { margin-top: auto; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.07); display: flex; align-items: baseline; gap: 12px; }
  .lv-plan .mono { font-size: 11px; color: #8fb5b0; }
  .lv-plan b { font-size: 24px; letter-spacing: -.03em; }
  .lv-plan .lv-pp { margin-left: auto; font-size: 14px; color: #8fb5b0; }
  .lv-acts { margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap; min-height: 34px; }
  .lv-acts span { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: rgba(47,240,212,.12); color: var(--teal); animation: pop .35s var(--ease) both; }
  .lv-acts .ic { width: 18px; height: 18px; }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } }
  .lv-need { margin-top: 12px; font-size: 13px; color: #8fb5b0; min-height: 18px; }
  .minilive { display: none; white-space: nowrap; font-size: 15px; font-weight: 700; color: var(--teal); font-variant-numeric: tabular-nums; }
  .step { min-height: 100%; width: 100%; max-width: 1180px; margin: 0 auto; padding: clamp(28px, 6vh, 72px) clamp(22px, 5vw, 56px) 40px; display: flex; flex-direction: column; }
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

  .bignum { display: flex; align-items: baseline; gap: 14px; border-bottom: 2px solid #22292e; padding-bottom: 10px; width: fit-content; min-width: min(100%, 360px); max-width: 100%; transition: border-color .2s; }
  .bignum:focus-within { border-color: var(--teal); }
  .bignum .pre, .bignum .suf { font-size: clamp(28px, 4vw, 48px); font-weight: 600; color: var(--dim); letter-spacing: -.03em; }
  .bignum .suf { white-space: nowrap; }
  .bignum input { width: 2ch; min-width: 1.35ch; max-width: 100%; background: none; border: 0; outline: none; font-size: clamp(56px, 8vw, 104px); font-weight: 700; letter-spacing: -.055em; line-height: 1; color: var(--ink); caret-color: var(--teal); }
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
  .field .bignum { margin-top: 16px; border-bottom-width: 1.5px; width: 100%; }
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
  .res-head { margin-top: 14px; font-size: clamp(30px, 4.2vw, 56px); font-weight: 700; letter-spacing: -.045em; line-height: 1.04; max-width: 20ch; }
  .res-head em { font-style: normal; color: var(--teal); }
  .motto { margin-top: 14px; font-size: clamp(20px, 2.2vw, 30px); font-weight: 700; letter-spacing: -.03em; color: #cfd6db; }
  .motto span { color: var(--teal); }
  .hero { margin-top: 30px; display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 16px; }
  .hcard { position: relative; overflow: hidden; border-radius: 24px; padding: clamp(24px, 3vw, 36px); background: linear-gradient(160deg, #0f2e2b 0%, #0b1717 60%, #0a1113 100%); border: 1px solid var(--line2); }
  .hcard::after { content: ""; position: absolute; width: 460px; height: 460px; right: -160px; top: -200px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(47,240,212,.22), transparent 65%); }
  .hcard .k { font-size: 12px; color: #8fb5b0; }
  .hcard .big { position: relative; margin-top: 12px; white-space: nowrap; font-size: clamp(52px, 7vw, 116px); font-weight: 700; letter-spacing: -.06em; line-height: .92; color: var(--teal); font-variant-numeric: tabular-nums; }
  .hcard .big small { font-size: .24em; letter-spacing: -.01em; color: #8fb5b0; font-weight: 500; margin-left: 8px; }
  .yr { margin-top: 12px; font-size: 15px; color: #b6c9c6; }
  .comp { margin-top: 24px; height: 12px; border-radius: 8px; display: flex; overflow: hidden; background: #0b1314; gap: 3px; }
  .comp i { display: block; height: 100%; }
  .legend { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; color: #b6c9c6; }
  .legend span { display: inline-flex; align-items: center; gap: 8px; }
  .legend b { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
  .hours { border-radius: 24px; padding: clamp(24px, 3vw, 34px); background: var(--card); border: 1px solid var(--line); display: flex; align-items: center; gap: clamp(18px, 2vw, 28px); }
  .ring { width: clamp(96px, 9vw, 132px); height: auto; flex: none; }
  .hn { font-size: clamp(56px, 6vw, 88px); font-weight: 700; letter-spacing: -.055em; line-height: .9; font-variant-numeric: tabular-nums; }
  .hu { margin-top: 8px; font-size: 18px; font-weight: 600; color: #fff; }
  .hd { margin-top: 2px; font-size: 15px; color: var(--muted); }
  .rgrid { margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
  .rc { border-radius: 20px; padding: 22px 24px; background: var(--card); border: 1px solid var(--line); }
  .rc .k { font-size: 11.5px; color: var(--muted); }
  .rc .v { margin-top: 8px; font-size: clamp(30px, 3vw, 40px); font-weight: 700; letter-spacing: -.045em; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .rc .v span { font-size: .42em; font-weight: 500; letter-spacing: 0; color: var(--muted); margin-left: 4px; }
  .rc .v.neg { color: #e8a0a0; }
  .rc .d { margin-top: 6px; font-size: 14px; color: var(--dim); line-height: 1.5; }
  .rc .d b { color: #cfd6db; }
  .rc .pre { font-style: normal; font-size: 10px; color: #c9a45c; margin-left: 4px; }
  .rc.net { border-color: #2a5a55; background: linear-gradient(180deg, #121c1c, #0f1415); }
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

  @media (max-width: 1180px) and (min-width: 901px) { .rgrid { grid-template-columns: 1fr 1fr; } .rc.net { grid-column: span 2; } }
  @media (max-width: 1100px) { .main { grid-template-columns: minmax(0, 1fr) 340px; } .lv-big { font-size: 52px; } }
  @media (max-width: 900px) {
    .main { grid-template-columns: minmax(0, 1fr); } .live { display: none; } .minilive { display: block; }
    .back { padding: 0 8px 0 4px; } .next { padding: 0 20px; }
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
      if ("IntersectionObserver" in window && !reduceMotion()) {
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { this.panel.classList.add("in"); io.disconnect(); } }), { threshold: 0.35 });
        io.observe(this.panel);
      } else this.panel.classList.add("in");
      this.root.querySelector(".cta").addEventListener("click", () => this.open());
    }

    vizSVG() {
      // recovered-time bars + rising profit line (decorative)
      const bars = [18, 26, 22, 34, 30, 42, 38, 50, 47, 58, 62, 70];
      const w = 300, h = 92, bw = 16, gap = (w - bars.length * bw) / (bars.length - 1);
      let b = "", pts = [];
      bars.forEach((v, i) => {
        const x = i * (bw + gap), y = h - v;
        b += `<rect style="--i:${i}" x="${x.toFixed(1)}" y="${y}" width="${bw}" height="${v}" rx="4" fill="${i > 7 ? "#2ff0d4" : "#1d3533"}"/>`;
        pts.push([x + bw / 2, Math.max(6, h - v - 12 - i * 0.8)]);
      });
      const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      return `<svg class="viz" viewBox="0 0 ${w} ${h}">${b}<path d="${d}" fill="none" stroke="#0aa8ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" fill="#0aa8ff"/></svg>`;
    }

    /* ---------- open / close with spatial transition ---------- */
    targetRect() {
      const vw = window.innerWidth, vh = window.innerHeight;
      if (vw < 700) return { top: 0, left: 0, width: vw, height: vh, radius: 0 };
      const w = Math.min(vw - 48, 1440), h = Math.min(vh - 48, 940);
      return { top: Math.round((vh - h) / 2), left: Math.round((vw - w) / 2), width: w, height: h, radius: 28 };
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
              <div class="main"><div class="stage"></div><aside class="live" aria-live="polite"></aside></div>
              <div class="nav"><button class="back" type="button">${icon("back")} Back</button><span class="kbd mono">Press Enter ↵</span><span class="minilive"></span><button class="next" type="button">Continue <span>→</span></button></div>
            </div>
          </div>
        </div>`;
      this.portal = host; this.sr = sr;
      this.overlay = sr.querySelector(".overlay");
      this.sheet = sr.querySelector(".sheet");
      this.inner = sr.querySelector(".sheet-inner");
      this.stage = sr.querySelector(".stage");
      this.live = sr.querySelector(".live");
      this.mainEl = sr.querySelector(".main");
      this.miniLive = sr.querySelector(".minilive");
      const kick = () => requestAnimationFrame(() => this.updateLive());
      this.stage.addEventListener("input", kick); this.stage.addEventListener("click", kick);
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
      this.mainEl.classList.toggle("full", isRes);
      if (!isRes) this.updateLive();
      this.stage.scrollTop = 0;
      this["bind" + (isRes ? "Results" : n)](el);
      this.updateNext();
      if (!isRes) { const f = el.querySelector("input"); f && setTimeout(() => f.focus({ preventScroll: true }), 60); }
    }
    updateNext() { this.btnNext.disabled = !this.valid(); }

    updateLive() {
      if (!this.live) return;
      const st = this.state, r = compute(st, this.assumptions);
      const max = Math.max(r.timeValueRecovered, r.customerProfit, 1);
      const acts = CONFIG.activities.filter((a) => st.activities.includes(a.id));
      const need = [];
      if (!num(st.monthlyCostPerEmployee)) need.push("admin cost");
      if (!num(st.profitPerCustomer)) need.push("customer value");
      if (!this.live.firstChild) {
        this.live.innerHTML = `
          <div class="lv-card">
            <div class="lv-top"><span class="mono">Live estimate</span><span class="lv-dot"></span></div>
            <div class="lv-k mono">Est. economic benefit</div>
            <div class="lv-big"><span class="lv-n">$0</span><small>/mo</small></div>
            <div class="lv-yr">≈ <b class="lv-y">$0</b> a year</div>
            <div class="lv-row"><div class="lv-l"><span>Employee capacity</span><b class="lv-t">$0</b></div><div class="lv-bar"><i class="lv-tb" style="background:var(--teal)"></i></div></div>
            <div class="lv-row"><div class="lv-l"><span>Customer profit</span><b class="lv-p">$0</b></div><div class="lv-bar"><i class="lv-pb" style="background:var(--blue)"></i></div></div>
            <div class="lv-hrs"><div><b class="lv-h">0</b><span>hours / month<br>back to your team</span></div><svg class="lv-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/><circle class="lv-rc" cx="22" cy="22" r="18" fill="none" stroke="#2ff0d4" stroke-width="5" stroke-linecap="round" stroke-dasharray="113.1" stroke-dashoffset="113.1" transform="rotate(-90 22 22)"/></svg></div>
            <div class="lv-plan"><span class="mono">Plan</span><b class="lv-pn">—</b><span class="lv-pp"></span></div>
            <div class="lv-acts"></div>
            <div class="lv-need"></div>
          </div>`;
      }
      const q = (c) => this.live.querySelector(c);
      this.tween(q(".lv-n"), r.monthlyBenefit);
      this.tween(this.miniLive, r.monthlyBenefit, (v) => "Est. " + money(v) + "/mo");
      const hrsBack = num(st.weeklyHours) * CONFIG.constants.weeksPerMonth * this.assumptions.automationRate;
      this.tween(q(".lv-y"), r.monthlyBenefit * 12);
      this.tween(q(".lv-h"), hrsBack, (v) => String(Math.round(v)));
      q(".lv-rc").style.strokeDashoffset = 113.1 * (1 - this.assumptions.automationRate * (hrsBack > 0 ? 1 : 0));
      q(".lv-t").textContent = money(r.capacityValue);
      q(".lv-p").textContent = money(r.customerProfit);
      q(".lv-tb").style.width = (r.timeValueRecovered / max) * 100 + "%";
      q(".lv-pb").style.width = (r.customerProfit / max) * 100 + "%";
      q(".lv-pn").textContent = r.plan ? r.plan.name : "—";
      q(".lv-pp").textContent = r.plan ? money(r.plan.price) + "/mo" : "Pick your workload";
      q(".lv-acts").innerHTML = acts.map((a) => `<span title="${a.label}">${icon(a.icon)}</span>`).join("");
      q(".lv-need").textContent = need.length && st.step <= STEPS ? "Add your " + need.join(" and ") + " to complete the picture." : "";
    }
    tween(node, to, fmt = money) {
      if (!node) return;
      const from = node._v || 0; node._v = to;
      if (reduceMotion() || Math.abs(to - from) < 1) { node.textContent = fmt(to); return; }
      cancelAnimationFrame(node._raf);
      const t0 = performance.now(), d = 520;
      const step = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); node.textContent = fmt(from + (to - from) * e); if (k < 1) node._raf = requestAnimationFrame(step); };
      node._raf = requestAnimationFrame(step);
    }
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
    sizeInput(inp) { const fit = () => (inp.style.width = Math.max(1, (inp.value || inp.placeholder || "0").length) + 0.1 + "ch"); inp.addEventListener("input", fit); fit(); }
    bindRange(el, key, max) {
      const inp = el.querySelector(".bignum input"), r = el.querySelector(".range input");
      const sync = (v, from) => {
        this.state[key] = v;
        const n = num(v);
        if (from !== "r") r.value = Math.min(n, max);
        if (from !== "i") { inp.value = v; inp.dispatchEvent(new Event("input")); }
        r.style.setProperty("--p", (Math.min(n, max) / max) * 100 + "%");
      };
      inp.addEventListener("input", () => sync(inp.value.replace(/[^0-9.]/g, ""), "i"));
      r.addEventListener("input", () => sync(r.value, "r"));
      this.sizeInput(inp);
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
      inp.value = this.state.profitPerCustomer; this.sizeInput(inp);
      inp.addEventListener("input", () => { this.state.profitPerCustomer = inp.value; mark(); });
      pills.forEach((p) => p.addEventListener("click", () => { inp.value = p.dataset.v; inp.dispatchEvent(new Event("input")); this.state.profitPerCustomer = p.dataset.v; mark(); inp.focus(); }));
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
      inp.value = this.state.monthlyCostPerEmployee; this.sizeInput(inp);
      inp.addEventListener("input", () => (this.state.monthlyCostPerEmployee = inp.value));
      show();
    }

    /* ---------- results ---------- */
    resultsHTML() {
      const r = compute(this.state, this.assumptions);
      const acts = CONFIG.activities.filter((a) => this.state.activities.includes(a.id));
      const a = this.assumptions, C = CONFIG.constants;
      const sl = (k, label, desc) => `<div class="as"><label for="as-${k}">${label}</label><small>${desc}</small><div class="row"><input id="as-${k}" type="range" min="0" max="100" step="1" value="${Math.round(a[k] * 100)}" data-a="${k}"><output>${pct(a[k])}</output></div></div>`;
      const hrs = Math.round(r.hoursRecovered);
      const ring = 2 * Math.PI * 52, share = Math.min(1, a.automationRate);
      return `
        <div class="q-num mono">Your estimate</div>
        <h2 class="res-head">Here's what <em>olo</em> could give back to your business.</h2>
        <p class="motto">Same team. Less busywork. <span>More business.</span></p>

        <div class="hero">
          <div class="hcard">
            <div class="k mono">Estimated total economic benefit</div>
            <div class="big" data-count="${r.monthlyBenefit}">${money(r.monthlyBenefit)}<small>/mo</small></div>
            <div class="yr">≈ ${money(r.monthlyBenefit * 12)} a year in capacity and profit</div>
            <div class="comp">${this.compBars(r)}</div>
            <div class="legend"><span><b style="background:#2ff0d4"></b>Employee capacity</span><span><b style="background:#0aa8ff"></b>Customer profit</span></div>
          </div>
          <div class="hours">
            <svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="10"/><circle cx="60" cy="60" r="52" fill="none" stroke="#2ff0d4" stroke-width="10" stroke-linecap="round" stroke-dasharray="${ring.toFixed(1)}" stroke-dashoffset="${(ring * (1 - (hrs > 0 ? share : 0))).toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
            <div><div class="hn" data-count="${hrs}">${hrs}</div><div class="hu">hours / month</div><div class="hd">returned to your team</div></div>
          </div>
        </div>

        <div class="rgrid">
          <div class="rc"><div class="k mono">Employee capacity</div><div class="v">${money(r.capacityValue)}<span>/mo</span></div><div class="d">Available for more valuable work.</div>${r.flags.noCost ? '<div class="note">Add a monthly employment cost to value this time.</div>' : ""}</div>
          <div class="rc"><div class="k mono">Additional customer profit</div><div class="v">${money(r.customerProfit)}<span>/mo</span></div><div class="d">≈ ${r.customersRecovered.toFixed(1)} recovered customers a month.</div>${r.flags.noProfit ? '<div class="note">Add a profit per customer to value recovered leads.</div>' : ""}</div>
          <div class="rc net"><div class="k mono">Net benefit after olo</div><div class="v ${r.netMonthly >= 0 ? "" : "neg"}">${money(r.netMonthly)}<span>/mo</span></div>
            <div class="d">On <b>${r.plan ? r.plan.name : "—"}</b> ${r.plan ? "(" + money(r.plan.price) + "/mo)" : ""} <i class="pre mono">Preliminary</i><br>First month: ${money(r.firstMonthNet)} after ${money(C.setupFee)} setup.</div></div>
        </div>

        ${acts.length ? `<div class="acts"><h3 class="mono">What olo could take off your plate</h3><ul>${acts.map((x) => `<li>${icon(x.icon)}${x.label}</li>`).join("")}</ul></div>` : ""}
        <details>
          <summary>How we calculated this</summary>
          <div class="how">
            <p>Everything here is an estimate, not a guarantee. olo doesn't replace your people: recovered hours stay with your team, and we value them at what that time already costs you so they can go toward more valuable work. Employee capacity is counted once, never on top of payroll. Adjust any assumption to recalculate.</p>
            <div class="assm">
              ${sl("automationRate", "Admin work olo handles", "Share of weekly admin time automated")}
              ${sl("recoveryRate", "Leads recovered", "Missed leads won back by better follow-up")}
              ${sl("conversionRate", "Recovered → customers", "Recovered leads that become paying customers")}
            </div>
            <button type="button" class="reset">Reset to defaults</button>
            <div class="formula">
              <code>Hours returned = weekly admin hours × ${C.weeksPerMonth} × ${pct(a.automationRate)}</code><br>
              <code>Hourly employment cost = monthly cost per employee ÷ ${C.hoursPerMonth}${r.hourlyCost ? " = " + money(r.hourlyCost) + "/hr" : ""}</code><br>
              <code>Employee capacity = hours returned × hourly employment cost</code><br>
              <code>Customer profit = missed leads × ${pct(a.recoveryRate)} × ${pct(a.conversionRate)} × profit per customer</code><br>
              <code>Net benefit = employee capacity + customer profit − olo plan</code>
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
        <p class="disc">Estimates only, based on your inputs and the assumptions above. Not a guarantee of savings or revenue. Employee capacity is economic value, not a cash saving. Plan recommendation is preliminary and doesn't account for seat requirements.</p>
        <p style="margin-top:22px"><button type="button" class="back restart">${icon("back")} Edit my answers</button></p>`;
    }
    compBars(r) {
      const t = Math.max(r.capacityValue, 0), p = Math.max(r.customerProfit, 0);
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
      const hn = el.querySelector(".hn"), ht = +hn.dataset.count;
      if (!reduceMotion() && ht > 0) { const t1 = performance.now(); const tk = (t) => { const k = Math.min(1, (t - t1) / 900); hn.textContent = Math.round(ht * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tk); }; hn.textContent = "0"; requestAnimationFrame(tk); }
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
      const hn = el.querySelector(".hn"); hn.textContent = hn.dataset.count;
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
          monthlyBenefit: Math.round(r.monthlyBenefit), hoursReturned: Math.round(r.hoursRecovered), employeeCapacity: Math.round(r.capacityValue),
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
          "- Hours returned to my team: " + R.hoursReturned + "/month",
          "- Employee capacity: " + money(R.employeeCapacity) + "/month",
          "- Estimated total economic benefit: " + money(R.monthlyBenefit) + "/month",
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
