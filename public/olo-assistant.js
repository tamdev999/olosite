/*!
 * olo site assistant: drop-in, no dependencies.
 *   <script src="/olo-assistant.js" defer></script>
 * Adds an "Ask olo" button (bottom-right). Opens a panel on desktop, a full-screen sheet on mobile.
 * Talks to POST /api/ask (streams plain text). Change endpoint via window.OloAssistant = { endpoint: "/api/ask" }.
 * Voice mode: live two-way conversation through an ElevenLabs agent (loaded only when tapped).
 *   window.OloAssistant = { voiceAgentId: "agent_...", voiceScript: "/elevenlabs-client.min.js" }
 */
(function () {
  "use strict";
  if (customElements.get("olo-assistant")) return;

  const CFG = () => Object.assign({ endpoint: "/api/ask", voiceAgentId: "agent_8001m7cgdp6zfhzr829khha190qj", voiceScript: "/elevenlabs-client.min.js" }, window.OloAssistant || {});
  const SUGGESTIONS = ["What does olo do?", "How much does it cost?", "How is this different from ChatGPT?", "What tools does it work with?"];
  const GREETING = "Hi! I can answer questions about olo: what it does, pricing, setup, and how it works. What would you like to know?";

  const LOGO = '<svg viewBox="190 370 872 464" aria-hidden="true"><defs><linearGradient id="oag" gradientUnits="userSpaceOnUse" x1="200" y1="600" x2="1052" y2="600"><stop offset="0" stop-color="#00f5dc"/><stop offset=".5" stop-color="#05d4f0"/><stop offset="1" stop-color="#0aa8ff"/></linearGradient></defs><g fill="none" stroke="url(#oag)" stroke-width="30"><circle cx="392" cy="601" r="180"/><circle cx="861" cy="601" r="180"/></g><rect x="612" y="381" width="30" height="442" rx="15" fill="url(#oag)"/></svg>';
  const I = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    end: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
  };

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .r { --teal: #2ff0d4; --ink: #f4f7f8; --muted: #9aa3ab; --dim: #66707a; --line: #232a2f; --ease: cubic-bezier(.2,.8,.2,1);
    font-family: var(--olo-font, "Geist", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif); color: var(--ink); -webkit-font-smoothing: antialiased; }
  button, textarea { font: inherit; color: inherit; background: none; border: 0; }
  button { cursor: pointer; }
  :focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
  textarea:focus-visible { outline: none; }

  .fab { position: fixed; right: 22px; bottom: 22px; z-index: 2147482500; display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 20px 0 16px;
    border-radius: 999px; background: rgba(9,11,12,.86); border: 1px solid rgba(47,240,212,.35); color: #fff; font-size: 15px; font-weight: 600; letter-spacing: -.01em;
    -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: 0 16px 40px -12px rgba(0,0,0,.7), 0 0 0 4px rgba(47,240,212,.06);
    transition: transform .25s var(--ease), opacity .25s, border-color .2s; }
  .fab:hover { transform: translateY(-2px); border-color: var(--teal); }
  .fab svg { width: 30px; height: 16px; }
  .fab.hide { opacity: 0; transform: translateY(12px) scale(.96); pointer-events: none; }

  .panel { position: fixed; right: 22px; bottom: 22px; z-index: 2147482501; width: 400px; height: min(640px, calc(100vh - 44px)); display: flex; flex-direction: column;
    border-radius: 24px; overflow: hidden; background: radial-gradient(120% 60% at 100% 0%, #0d2826 0%, #08090a 55%), #08090a;
    border: 1px solid #1c2428; box-shadow: 0 40px 100px -20px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.02) inset;
    transform-origin: 100% 100%; opacity: 0; transform: translateY(16px) scale(.96); pointer-events: none; transition: opacity .28s var(--ease), transform .32s var(--ease); }
  .panel.on { opacity: 1; transform: none; pointer-events: auto; }
  .hd { display: flex; align-items: center; gap: 12px; padding: 16px 16px 14px 18px; border-bottom: 1px solid #141a1d; }
  .hd .lg { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #0f1a1a; border: 1px solid #1e3533; }
  .hd .lg svg { width: 26px; height: 14px; }
  .hd .t { flex: 1; } .hd .t b { display: block; font-size: 16px; letter-spacing: -.01em; }
  .hd .t span { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); margin-top: 2px; }
  .hd .t span::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 0 3px rgba(47,240,212,.15); }
  .x { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); border: 1px solid var(--line); transition: color .2s, border-color .2s; }
  .x:hover { color: #fff; border-color: #3a434a; } .x svg { width: 18px; height: 18px; }

  .log { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 18px 16px 8px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
  .m { max-width: 88%; font-size: 15px; line-height: 1.5; letter-spacing: -.005em; animation: in .3s var(--ease) both; overflow-wrap: anywhere; }
  @keyframes in { from { opacity: 0; transform: translateY(6px); } }
  .m.a { align-self: flex-start; color: #dfe5ea; }
  .m.a .b { padding: 12px 14px; border-radius: 16px 16px 16px 6px; background: #12171a; border: 1px solid #1d2428; }
  .m.u { align-self: flex-end; }
  .m.u .b { padding: 10px 14px; border-radius: 16px 16px 6px 16px; background: var(--teal); color: #031a1c; font-weight: 500; }
  .m .b p + p, .m .b p + ul, .m .b ul + p { margin-top: 8px; }
  .m .b ul { padding-left: 18px; } .m .b li + li { margin-top: 3px; }
  .m .b strong { color: #fff; font-weight: 650; }
  .m .b a { color: var(--teal); text-decoration: underline; text-underline-offset: 2px; }
  .dots { display: inline-flex; gap: 4px; padding: 4px 0; } .dots i { width: 6px; height: 6px; border-radius: 50%; background: #5d6a70; animation: d 1.1s infinite; }
  .dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
  @keyframes d { 0%, 60%, 100% { opacity: .35; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }

  .sug { display: flex; flex-wrap: wrap; gap: 8px; padding: 2px 16px 12px; }
  .sug button { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 13px; border-radius: 999px; border: 1px solid #1f3a37; background: #0d1b1b;
    color: #cfeeea; font-size: 13.5px; font-weight: 500; transition: border-color .2s, background .2s; }
  .sug button:hover { border-color: var(--teal); background: #10292a; }
  .sug svg { width: 14px; height: 14px; color: var(--teal); }

  .in { padding: 10px 12px 12px; border-top: 1px solid #141a1d; }
  .box { display: flex; align-items: flex-end; gap: 8px; padding: 6px 6px 6px 14px; border-radius: 18px; background: #0f1315; border: 1px solid var(--line); transition: border-color .2s; }
  .box:focus-within { border-color: #2a5a55; }
  textarea { flex: 1; resize: none; outline: none; max-height: 120px; min-height: 24px; padding: 8px 0; font-size: 16px; line-height: 1.4; color: #fff; }
  textarea::placeholder { color: #56626a; }
  .go { flex: none; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--teal); color: #031a1c; transition: opacity .2s, transform .15s; }
  .go:disabled { opacity: .3; cursor: default; } .go:not(:disabled):hover { transform: translateY(-1px); } .go svg { width: 18px; height: 18px; }
  .mic { flex: none; width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; color: var(--teal); background: #10292a; border: 1px solid #1f3a37; transition: border-color .2s, background .2s; }
  .mic:hover { border-color: var(--teal); background: #12322f; } .mic svg { width: 19px; height: 19px; }
  .talk { display: flex; align-items: center; gap: 10px; width: 100%; height: 46px; margin-bottom: 10px; padding: 0 14px; border-radius: 14px; background: linear-gradient(100deg, #10302d, #0d1f22); border: 1px solid #1f4a45; color: #dff7f3; font-size: 14.5px; font-weight: 600; text-align: left; transition: border-color .2s; }
  .talk:hover { border-color: var(--teal); } .talk svg { width: 18px; height: 18px; color: var(--teal); } .talk small { margin-left: auto; font-size: 12px; font-weight: 500; color: #8fb5b0; }
  .voice { display: none; flex-direction: column; align-items: center; padding: 18px 16px 14px; border-top: 1px solid #141a1d; background: radial-gradient(80% 120% at 50% 100%, rgba(47,240,212,.10), transparent 70%); }
  .panel.voicing .voice { display: flex; } .panel.voicing .in, .panel.voicing .sug { display: none; }
  .orb { position: relative; width: 112px; height: 112px; display: grid; place-items: center; }
  .orb::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #8ff7e8 0%, #2ff0d4 35%, #0aa8ff 75%, #0a5fcf 100%);
    box-shadow: 0 0 60px rgba(47,240,212,.35); transform: scale(calc(.78 + var(--lvl, 0) * .32)); transition: transform .08s linear; }
  .orb::after { content: ""; position: absolute; inset: -10px; border-radius: 50%; border: 2px solid rgba(47,240,212,.25); transform: scale(calc(.9 + var(--lvl, 0) * .25)); transition: transform .12s linear; }
  .orb.idle::before { animation: breathe 2.4s ease-in-out infinite; }
  @keyframes breathe { 50% { transform: scale(.86); } }
  .vs { margin-top: 16px; font-size: 14px; font-weight: 600; color: #dff7f3; min-height: 20px; }
  .vh { margin-top: 4px; font-size: 12px; color: var(--dim); text-align: center; }
  .vend { margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 18px; border-radius: 999px; background: #2a1416; border: 1px solid #5a2a2e; color: #f3b9bd; font-size: 14px; font-weight: 600; }
  .vend:hover { border-color: #e88a90; } .vend svg { width: 16px; height: 16px; }
  .m.sys { align-self: center; font-size: 12px; color: var(--dim); }
  .ft { margin-top: 8px; text-align: center; font-size: 11px; color: var(--dim); }

  @media (max-width: 640px) {
    .fab { right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); height: 50px; }
    .panel { inset: 0; right: 0; bottom: 0; width: 100%; height: 100%; height: 100dvh; border-radius: 0; border: 0; transform: translateY(24px); }
    .hd { padding-top: calc(14px + env(safe-area-inset-top)); }
    .in { padding-bottom: calc(12px + env(safe-area-inset-bottom)); }
    .m { max-width: 92%; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
  `;

  // tiny, safe markdown: escape first, then **bold**, links, emails, bullet lists, paragraphs
  function md(src) {
    const esc = src.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const inline = (s) => s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|[\s(])((?:https?:\/\/)?meetolo\.ai(?:\/[\w\-/]*)?)/g, (m, pre, url) => `${pre}<a href="${url.startsWith("http") ? url : "https://" + url}" target="_blank" rel="noopener">${url}</a>`)
      .replace(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g, '<a href="mailto:$1">$1</a>');
    const out = []; let list = null;
    for (const raw of esc.split("\n")) {
      const line = raw.trim();
      const li = line.match(/^(?:[-*•]|\d+\.)\s+(.*)/);
      if (li) { (list || (list = [])).push(`<li>${inline(li[1])}</li>`); continue; }
      if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; }
      if (line) out.push(`<p>${inline(line)}</p>`);
    }
    if (list) out.push(`<ul>${list.join("")}</ul>`);
    return out.join("");
  }

  class OloAssistant extends HTMLElement {
    connectedCallback() {
      if (this.ready) return; this.ready = true;
      this.history = []; this.busy = false;
      const sr = this.attachShadow({ mode: "open" });
      sr.innerHTML = `<style>${CSS}</style><div class="r">
        <button class="fab" type="button" aria-haspopup="dialog" aria-label="Ask olo a question">${LOGO}<span>Ask olo</span></button>
        <section class="panel" role="dialog" aria-label="Ask olo" aria-modal="false">
          <div class="hd"><div class="lg">${LOGO}</div><div class="t"><b>Ask olo</b><span>Answers about olo, instantly</span></div><button class="x" type="button" aria-label="Close">${I.close}</button></div>
          <div class="log" aria-live="polite"></div>
          <div class="sug"></div>
          <div class="voice" aria-live="polite"><div class="orb idle"></div><div class="vs">Connecting…</div><div class="vh">Speak naturally. You can interrupt anytime.</div><button class="vend" type="button">${I.end}End voice chat</button></div>
          <form class="in"><button class="talk" type="button">${I.mic}Talk to olo<small>Voice</small></button><div class="box"><textarea rows="1" placeholder="Ask anything about olo…" aria-label="Your question" maxlength="800"></textarea><button class="go" type="submit" aria-label="Send" disabled>${I.send}</button></div>
            <div class="ft">AI answers can be imperfect. For anything important, email josh@meetolo.ai.</div></form>
        </section></div>`;
      this.$ = (s) => sr.querySelector(s);
      this.fab = this.$(".fab"); this.panel = this.$(".panel"); this.log = this.$(".log"); this.ta = this.$("textarea"); this.go = this.$(".go");
      this.fab.addEventListener("click", () => this.open());
      this.$(".x").addEventListener("click", () => this.close());
      this.$("form").addEventListener("submit", (e) => { e.preventDefault(); this.send(this.ta.value); });
      this.ta.addEventListener("input", () => this.grow());
      this.ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.send(this.ta.value); } });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && this.panel.classList.contains("on")) this.close(); });
      this.$(".talk").addEventListener("click", () => this.startVoice());
      this.$(".vend").addEventListener("click", () => this.endVoice());
      if (!CFG().voiceAgentId) { this.$(".talk").remove(); }
      this.add("a", GREETING);
      this.renderSug();
    }
    open() {
      this.panel.classList.add("on"); this.fab.classList.add("hide"); this.fab.setAttribute("aria-expanded", "true");
      if (window.matchMedia("(max-width: 640px)").matches) { this.prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden"; }
      setTimeout(() => this.ta.focus({ preventScroll: true }), 120);
    }
    close() {
      this.endVoice();
      this.panel.classList.remove("on"); this.fab.classList.remove("hide"); this.fab.setAttribute("aria-expanded", "false");
      if (this.prevOverflow !== undefined) { document.documentElement.style.overflow = this.prevOverflow; this.prevOverflow = undefined; }
      this.fab.focus({ preventScroll: true });
    }
    grow() { this.ta.style.height = "auto"; this.ta.style.height = Math.min(this.ta.scrollHeight, 120) + "px"; this.go.disabled = this.busy || !this.ta.value.trim(); }
    renderSug() {
      const box = this.$(".sug");
      box.innerHTML = this.history.length ? "" : SUGGESTIONS.map((s) => `<button type="button">${I.spark}${s}</button>`).join("");
      box.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => this.send(SUGGESTIONS[i])));
    }
    add(who, text) {
      const el = document.createElement("div"); el.className = "m " + who;
      if (who === "sys") { el.textContent = text; this.log.appendChild(el); this.log.scrollTop = this.log.scrollHeight; return el; }
      el.innerHTML = `<div class="b">${who === "u" ? md(text).replace(/<a [^>]*>|<\/a>/g, "") : text === null ? '<span class="dots"><i></i><i></i><i></i></span>' : md(text)}</div>`;
      this.log.appendChild(el); this.log.scrollTop = this.log.scrollHeight; return el;
    }
    async send(text) {
      text = (text || "").trim(); if (!text || this.busy) return;
      this.busy = true; this.ta.value = ""; this.grow();
      this.history.push({ role: "user", content: text }); this.add("u", text); this.renderSug();
      const bubble = this.add("a", null), body = bubble.querySelector(".b");
      let answer = "";
      try {
        const res = await fetch(CFG().endpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: this.history.slice(-12) }),
        });
        if (!res.ok || !res.body) { answer = (await res.text().catch(() => "")) || "Sorry, something went wrong. You can reach the team at josh@meetolo.ai."; }
        else {
          const reader = res.body.getReader(), dec = new TextDecoder();
          for (;;) {
            const { value, done } = await reader.read(); if (done) break;
            answer += dec.decode(value, { stream: true }); body.innerHTML = md(answer);
            const nearBottom = this.log.scrollHeight - this.log.scrollTop - this.log.clientHeight < 120; if (nearBottom) this.log.scrollTop = this.log.scrollHeight;
          }
        }
      } catch { answer = "I'm having trouble connecting right now. You can reach the team at josh@meetolo.ai."; }
      if (!answer.trim()) answer = "Sorry, I didn't catch that. Could you rephrase?";
      body.innerHTML = md(answer);
      this.history.push({ role: "assistant", content: answer });
      this.busy = false; this.grow(); this.log.scrollTop = this.log.scrollHeight;
    }
  }
  OloAssistant.prototype.loadSdk = function () {
    if (window.ElevenLabsClient) return Promise.resolve(window.ElevenLabsClient);
    if (this._sdk) return this._sdk;
    this._sdk = new Promise((ok, fail) => {
      const sc = document.createElement("script"); sc.src = CFG().voiceScript; sc.async = true;
      sc.onload = () => (window.ElevenLabsClient ? ok(window.ElevenLabsClient) : fail(new Error("sdk")));
      sc.onerror = () => { this._sdk = null; fail(new Error("sdk")); };
      document.head.appendChild(sc);
    });
    return this._sdk;
  };
  OloAssistant.prototype.vstate = function (txt, idle) { this.$(".vs").textContent = txt; this.$(".orb").classList.toggle("idle", !!idle); };
  OloAssistant.prototype.startVoice = async function () {
    if (this.voice || this.voiceStarting) return;
    this.voiceStarting = true;
    this.panel.classList.add("voicing"); this.$(".sug").innerHTML = ""; this.vstate("Connecting…", true);
    const fail = (msg) => { this.voiceStarting = false; this.panel.classList.remove("voicing"); this.add("a", msg); this.renderSug(); };
    try {
      const EL = await this.loadSdk();
      const strip = EL.stripAudioTags || ((t) => t.replace(/\[[^\]]{1,24}\]\s*/g, ""));
      this.voice = await EL.Conversation.startSession({
        agentId: CFG().voiceAgentId, connectionType: "webrtc", textOnly: false,
        onConnect: () => { this.vstate("Listening…", false); this.add("sys", "Voice chat started"); },
        onDisconnect: () => this.endVoice(true),
        onError: (m) => { console.warn("[olo voice]", m); },
        onModeChange: ({ mode }) => this.vstate(mode === "speaking" ? "olo is speaking…" : "Listening…", false),
        onMessage: (p) => {
          const t = strip(p.message || "").trim(); if (!t) return;
          const who = (p.role || (p.source === "ai" ? "agent" : "user")) === "agent" ? "a" : "u";
          this.add(who, t); this.history.push({ role: who === "a" ? "assistant" : "user", content: t });
        },
      });
      this.voiceStarting = false;
      const orb = this.$(".orb");
      const tick = () => {
        if (!this.voice) { orb.style.setProperty("--lvl", 0); return; }
        let v = 0; try { v = Math.max(this.voice.getOutputVolume() || 0, (this.voice.getInputVolume() || 0) * 0.8); } catch (e) {}
        orb.style.setProperty("--lvl", Math.min(1, v * 1.6).toFixed(3)); this._raf = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn("[olo voice]", e);
      const denied = /permission|notallowed|denied/i.test(String(e && (e.name || e.message)));
      fail(denied ? "I need microphone access for voice. Allow the mic in your browser, or just type your question below." : "Voice isn't available right now. You can keep typing, and I'll answer here.");
    }
  };
  OloAssistant.prototype.endVoice = async function (fromServer) {
    const v = this.voice; this.voice = null; this.voiceStarting = false;
    cancelAnimationFrame(this._raf);
    if (!this.panel || !this.panel.classList.contains("voicing")) return;
    this.panel.classList.remove("voicing");
    if (v && !fromServer) { try { await v.endSession(); } catch (e) {} }
    this.add("sys", "Voice chat ended");
    this.renderSug();
    setTimeout(() => this.ta && this.ta.focus({ preventScroll: true }), 50);
  };
  customElements.define("olo-assistant", OloAssistant);
  const mount = () => { if (!document.querySelector("olo-assistant")) document.body.appendChild(document.createElement("olo-assistant")); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
