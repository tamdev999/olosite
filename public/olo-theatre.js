/*!
 * olo Theatre Mode: drop-in, no dependencies.
 *
 * Usage:
 *   1. Add data-theatre to the element that wraps your <video> (or to the <video> itself):
 *        <div data-theatre> <video ...></video> <button>Sound On</button> </div>
 *   2. Load once: <script src="/olo-theatre.js" defer></script>
 *
 * What it does: adds a "Theatre" button to the player. Clicking it blows the player
 * up to the centre of the screen (YouTube-style) while everything else fades to black.
 * Exit with the button, Esc, the "t" key, or clicking the dark area.
 * The video keeps playing through the transition (no restart, no reload).
 *
 * Optional JS API: OloTheatre.enter(el), OloTheatre.exit(), OloTheatre.toggle(el), OloTheatre.attach(el)
 */
(function () {
  "use strict";
  if (window.OloTheatre) return;

  const DUR = 460;                        // ms
  const EASE = "cubic-bezier(.2,.8,.2,1)";
  const reduce = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const css = `
  .olo-th-backdrop { position: fixed; inset: 0; z-index: 2147482000; background: #000; opacity: 0; cursor: zoom-out;
    -webkit-backdrop-filter: blur(0px); backdrop-filter: blur(0px); transition: opacity ${DUR}ms ${EASE}, backdrop-filter ${DUR}ms ${EASE}, -webkit-backdrop-filter ${DUR}ms ${EASE}; }
  .olo-th-backdrop.on { opacity: .97; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
  .olo-th-stage { position: fixed; z-index: 2147482001; margin: 0 !important; box-sizing: border-box; will-change: top, left, width, height;
    border-radius: 18px; overflow: hidden; box-shadow: 0 40px 140px -20px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.06); background: #000; }
  .olo-th-stage > * { border-radius: inherit !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; margin: 0 !important; }
  .olo-th-stage video, .olo-th-stage > video { object-fit: contain; background: #000; width: 100% !important; height: 100% !important; }
  .olo-th-host { position: relative; }
  .olo-th-btn { position: absolute; right: 14px; bottom: 14px; z-index: 5; display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px 0 12px;
    border: 1px solid rgba(255,255,255,.18); border-radius: 999px; background: rgba(8,10,11,.55); color: #fff; cursor: pointer;
    font: 600 13px/1 "Geist", "Inter", ui-sans-serif, system-ui, sans-serif; letter-spacing: .01em;
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); opacity: .85; transition: opacity .2s, background .2s, border-color .2s, transform .2s; }
  .olo-th-btn:hover { opacity: 1; background: rgba(8,10,11,.75); border-color: #2ff0d4; transform: translateY(-1px); }
  .olo-th-btn:focus-visible { outline: 2px solid #2ff0d4; outline-offset: 3px; }
  .olo-th-btn svg { width: 18px; height: 18px; }
  .olo-th-btn .x { display: none; } .olo-th-active .olo-th-btn .x { display: block; } .olo-th-active .olo-th-btn .e { display: none; }
  .olo-th-hint { position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); z-index: 2147482002; color: rgba(255,255,255,.55);
    font: 500 12px/1 "IBM Plex Mono", ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; opacity: 0; transition: opacity .4s .3s; pointer-events: none; }
  .olo-th-hint.on { opacity: 1; }
  html.olo-th-lock, html.olo-th-lock body { overflow: hidden !important; }
  @media (max-width: 700px) { .olo-th-btn span { display: none; } .olo-th-btn { padding: 0 10px; } .olo-th-stage { border-radius: 0; } }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<g class="e"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M7 10V8h3M17 14v2h-3"/></g>' +
    '<g class="x"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M10 8v2H7M14 16v-2h3"/></g></svg>';

  let state = null;   // { el, placeholder, stage, backdrop, hint, from }

  function aspectOf(el) {
    const v = el.tagName === "VIDEO" ? el : el.querySelector("video");
    if (v && v.videoWidth && v.videoHeight) return v.videoWidth / v.videoHeight;
    const r = el.getBoundingClientRect();
    return r.width && r.height ? r.width / r.height : 16 / 9;
  }

  function targetRect(aspect) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const pad = vw < 700 ? 0 : Math.max(24, Math.min(64, vw * 0.04));
    const bottomRoom = vw < 700 ? 0 : 48;            // leaves space for the "Esc" hint
    let w = vw - pad * 2, h = w / aspect;
    const maxH = vh - pad * 2 - bottomRoom;
    if (h > maxH) { h = maxH; w = h * aspect; }
    return { left: (vw - w) / 2, top: (vh - bottomRoom - h) / 2, width: w, height: h };
  }

  const px = (r) => ({ left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });

  function enter(el) {
    if (state || !el) return;
    const from = el.getBoundingClientRect();
    const aspect = aspectOf(el);
    const cs = getComputedStyle(el);

    // Placeholder keeps the page layout exactly where it was.
    const placeholder = document.createElement("div");
    placeholder.style.cssText = `width:${from.width}px;height:${from.height}px;margin:${cs.margin};flex:${cs.flex};grid-area:${cs.gridArea};visibility:hidden;`;

    const backdrop = document.createElement("div");
    backdrop.className = "olo-th-backdrop";
    const hint = document.createElement("div");
    hint.className = "olo-th-hint";
    const touch = window.matchMedia && window.matchMedia("(hover: none)").matches;
    hint.textContent = touch ? "Tap outside to exit" : "Esc to exit theatre";
    const stage = document.createElement("div");
    stage.className = "olo-th-stage";
    stage.style.borderRadius = window.innerWidth < 700 ? "0px" : cs.borderRadius !== "0px" ? cs.borderRadius : "18px";

    // Move the player into the stage. Done in one synchronous step, so playback isn't interrupted.
    el.parentNode.insertBefore(placeholder, el);
    Object.assign(stage.style, px(from));
    stage.appendChild(el);
    document.body.append(backdrop, stage, hint);
    el.classList.add("olo-th-active");
    document.documentElement.classList.add("olo-th-lock");

    const to = targetRect(aspect);
    const dur = reduce() ? 1 : DUR;
    Object.assign(stage.style, px(to));
    stage.animate([px(from), px(to)], { duration: dur, easing: EASE });
    requestAnimationFrame(() => { backdrop.classList.add("on"); hint.classList.add("on"); });

    backdrop.addEventListener("click", exit);
    const onResize = () => Object.assign(stage.style, px(targetRect(aspect)));
    window.addEventListener("resize", onResize);
    state = { el, placeholder, stage, backdrop, hint, onResize };
    setLabel(el, true);
  }

  function exit() {
    if (!state || state.leaving) return;
    state.leaving = true;
    const { el, placeholder, stage, backdrop, hint, onResize } = state;
    const from = stage.getBoundingClientRect();
    const to = placeholder.getBoundingClientRect();
    const dur = reduce() ? 1 : DUR * 0.85;
    backdrop.classList.remove("on"); hint.classList.remove("on");
    window.removeEventListener("resize", onResize);
    stage.animate([px(from), px(to)], { duration: dur, easing: EASE, fill: "forwards" }).finished.then(() => {
      placeholder.parentNode.insertBefore(el, placeholder);   // back home, still playing
      placeholder.remove(); stage.remove(); hint.remove();
      setTimeout(() => backdrop.remove(), 120);
      el.classList.remove("olo-th-active");
      document.documentElement.classList.remove("olo-th-lock");
      setLabel(el, false);
      state = null;
    });
  }

  const toggle = (el) => (state ? exit() : enter(el));

  function setLabel(el, on) {
    const b = el.querySelector(":scope > .olo-th-btn");
    if (!b) return;
    b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", on ? "Exit theatre mode" : "Theatre mode");
    b.querySelector("span").textContent = on ? "Exit" : "Theatre";
  }

  function attach(el) {
    if (!el || el._oloTheatre) return;
    // A bare <video> can't hold a button, so wrap it.
    if (el.tagName === "VIDEO") {
      const wrap = document.createElement("div");
      const cs = getComputedStyle(el);
      wrap.style.cssText = `position:relative;display:${cs.display === "inline" ? "inline-block" : cs.display};width:${el.style.width || "auto"};border-radius:${cs.borderRadius};`;
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      wrap.setAttribute("data-theatre", "");
      el.removeAttribute("data-theatre");
      el = wrap;
    }
    el._oloTheatre = true;
    if (getComputedStyle(el).position === "static") el.classList.add("olo-th-host");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "olo-th-btn";
    b.innerHTML = ICON + "<span>Theatre</span>";
    b.addEventListener("click", (e) => { e.stopPropagation(); toggle(el); });
    el.appendChild(b);
    setLabel(el, false);
  }

  document.addEventListener("keydown", (e) => {
    const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === "Escape" && state) { e.preventDefault(); exit(); }
    else if ((e.key === "t" || e.key === "T") && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const el = state ? state.el : document.querySelector("[data-theatre]");
      if (el) toggle(el);
    }
  });

  const scan = () => document.querySelectorAll("[data-theatre]").forEach(attach);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan); else scan();
  // Pick up players rendered later (e.g. by React after hydration).
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });

  window.OloTheatre = { enter, exit, toggle, attach };
})();
