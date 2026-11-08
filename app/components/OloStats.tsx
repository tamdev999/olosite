'use client';

import { Fragment, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const CSS = `
.olo-stats{--ink:#04130f;--ink-soft:rgba(4,19,15,.66);--rule:rgba(4,19,15,.2);--pad:clamp(20px,5vw,72px);position:relative;isolation:isolate;overflow:hidden;color:var(--ink);-webkit-font-smoothing:antialiased;background:linear-gradient(172deg,#2fe6d3 0%,#1ccbc6 28%,#1aaec6 58%,#1587cf 100%)}
.olo-stats *,.olo-stats *::before,.olo-stats *::after{box-sizing:border-box}
.olo-stats h1,.olo-stats h2,.olo-stats h3,.olo-stats p{margin:0}
.olo-stats::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:5;opacity:.07;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.os-section{padding-left:var(--pad);padding-right:var(--pad)}
.os-display{font-weight:700;letter-spacing:-.04em;line-height:.94;text-wrap:balance}
.os-w{display:inline-block;overflow:hidden;vertical-align:top;padding:0 .14em .1em 0;margin:0 -.14em -.1em 0}
.os-wi,.os-sw{display:inline-block}
.os-num{font-variant-numeric:tabular-nums;font-weight:700;letter-spacing:-.05em;line-height:.8;display:inline-flex;align-items:flex-start}
.os-u{font-size:.42em;margin:.12em 0 0 .06em;letter-spacing:-.03em}
.os-marker{font-size:15px;font-weight:500;line-height:1.2;color:var(--ink-soft);margin-bottom:clamp(20px,3vw,40px);text-align:center}
.os-hero{padding-top:clamp(48px,9vw,120px);padding-bottom:clamp(20px,3vw,40px);text-align:center}
.os-hero h1{font-size:clamp(46px,8.4vw,148px);max-width:17.5ch;margin:0 auto}
.os-opp{padding-bottom:clamp(100px,16vw,220px);text-align:center}
.os-grid{display:grid;grid-template-columns:auto minmax(0,34rem);gap:clamp(32px,6vw,110px);align-items:end;justify-content:center}
.os-opp .os-num{font-size:clamp(150px,31vw,520px)}
.os-opp h2{font-size:clamp(28px,3.4vw,52px);font-weight:700;letter-spacing:-.035em;line-height:1.04;margin-bottom:20px}
.os-opp p{font-size:clamp(17px,1.5vw,22px);line-height:1.4;color:var(--ink-soft);text-align:left}
.os-opp small{display:block;margin-top:18px;font-size:14px;color:var(--ink-soft);opacity:.8;text-align:left}
.os-ticks{display:flex;gap:clamp(2px,.35vw,6px);height:clamp(36px,5vw,76px);margin-top:clamp(60px,8vw,120px);align-items:flex-end;max-width:60rem;margin-left:auto;margin-right:auto}
.os-ticks i{flex:1;height:38%;background:var(--rule);border-radius:1px;transform-origin:bottom}
.os-ticks i.on{height:100%;background:var(--ink)}
.os-why{padding-bottom:clamp(80px,12vw,180px);text-align:center}
.os-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:clamp(24px,6vw,110px);align-items:center;padding:clamp(36px,5.5vw,80px) 0;border-top:1px solid var(--rule);max-width:72rem;margin-left:auto;margin-right:auto}
.os-row:last-child{border-bottom:1px solid var(--rule)}
.os-row .os-num{font-size:clamp(100px,17vw,270px)}
.os-row h3{font-size:clamp(28px,3.6vw,56px);font-weight:700;letter-spacing:-.04em;line-height:1;margin-bottom:16px;text-align:left}
.os-row p{font-size:clamp(17px,1.5vw,22px);line-height:1.4;color:var(--ink-soft);max-width:30rem;text-align:left}
.os-bar{position:relative;height:4px;margin-top:clamp(22px,3vw,40px);background:var(--rule);border-radius:4px}
.os-bar i{position:absolute;inset:0;background:var(--ink);border-radius:inherit;transform-origin:left;transform:scaleX(var(--v))}
.os-close{padding-top:clamp(80px,12vw,180px);padding-bottom:clamp(120px,18vw,260px);text-align:center}
.os-statement{font-size:clamp(44px,9.4vw,160px)}
.os-sign{display:flex;align-items:center;justify-content:center;gap:clamp(20px,4vw,56px);flex-wrap:wrap;padding-bottom:clamp(60px,8vw,120px)}
.os-sign h2{font-size:clamp(22px,2.4vw,36px);font-weight:700;letter-spacing:-.03em}
.os-sign svg{height:clamp(44px,6vw,88px);width:auto}
.os-sources{padding:0 var(--pad) 40px;font-size:13px;line-height:1.5;color:var(--ink-soft);max-width:60rem;text-align:center;margin-left:auto;margin-right:auto;width:100%}
@media (max-width:760px){.os-grid,.os-row{grid-template-columns:1fr}.os-grid{align-items:start}}
`;

const ROWS = [
  { v: 73, title: 'Need more support.',       text: 'Would benefit from more AI training and implementation resources.' },
  { v: 48, title: 'Too many choices.',        text: 'Of AI users struggle to choose the right tools.' },
  { v: 50, title: 'Privacy matters.',         text: 'Of AI users cite data privacy and security challenges.' },
  { v: 59, title: 'Want to stay in control.', text: 'Feel more comfortable with AI when they can approve every action.' },
  { v: 43, title: 'Would pay more for less.', text: 'Would pay a premium for a solution that reduces the number of tools they use.' },
];

function Words({ text, masked = false }: { text: string; masked?: boolean }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          {masked
            ? <span className="os-w"><span className="os-wi">{w}</span></span>
            : <span className="os-sw">{w}</span>}{' '}
        </Fragment>
      ))}
    </>
  );
}

function Num({ value }: { value: number }) {
  return (
    <div className="os-num">
      <span className="os-n" data-to={value}>{value}</span>
      <span className="os-u">%</span>
    </div>
  );
}

export default function OloStats() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const el = root.current!;

    const ctx = gsap.context(() => {
      gsap.from('.os-hero .os-wi', { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: 0.1 });

      const count = (numEl: Element, trigger: Element | string) => {
        const out = numEl.querySelector<HTMLElement>('.os-n')!;
        const to = Number(out.dataset.to);
        const o = { v: 0 };
        out.textContent = '0';
        gsap.to(o, {
          v: to, ease: 'power2.out',
          onUpdate: () => { out.textContent = String(Math.round(o.v)); },
          scrollTrigger: { trigger, start: 'top 88%', end: 'top 38%', scrub: 0.6 },
        });
      };

      count(el.querySelector('.os-opp .os-num')!, '.os-grid');

      gsap.fromTo('.os-ticks i.on', { scaleY: 0.38 }, {
        scaleY: 1, ease: 'none', stagger: 0.06,
        scrollTrigger: { trigger: '.os-ticks', start: 'top 90%', end: 'top 50%', scrub: 0.6 },
      });

      gsap.utils.toArray<HTMLElement>('.os-row').forEach((row) => {
        const v = Number(row.dataset.v);
        count(row.querySelector('.os-num')!, row);
        gsap.fromTo(row.querySelector('.os-bar i'), { scaleX: 0 }, {
          scaleX: v / 100, ease: 'power2.out',
          scrollTrigger: { trigger: row, start: 'top 88%', end: 'top 38%', scrub: 0.6 },
        });
      });

      gsap.fromTo('.os-statement .os-sw', { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.18,
        scrollTrigger: { trigger: '.os-close', start: 'top 72%', end: 'bottom 62%', scrub: true },
      });
    }, root);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ctx.revert();
      el.querySelectorAll<HTMLElement>('.os-n').forEach((n) => { n.textContent = n.dataset.to ?? ''; });
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <section className="olo-stats" ref={root}>
        <div className="os-section os-hero">
          <h1 className="os-display"><Words text="We listened to what business owners really want." masked /></h1>
        </div>

        <div className="os-section os-opp">
          <p className="os-marker" style={{ textAlign: "center", fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 600, marginBottom: 12, marginTop: "clamp(40px, 6vw, 80px)" }}>01 / The Opportunity</p>
          <div className="os-grid">
            <Num value={15} />
            <div>
              <h2>AI is everywhere. Real integration isn&apos;t.</h2>
              <p>Only 15% of small businesses surveyed by Goldman Sachs have fully integrated AI into their core operations.</p>
              <small>Goldman Sachs, October 2026</small>
            </div>
          </div>
          <div className="os-ticks" aria-hidden="true">
            {Array.from({ length: 100 }, (_, i) => <i key={i} className={i < 15 ? 'on' : undefined} />)}
          </div>
        </div>

        <div className="os-section os-why">
          <p className="os-marker" style={{ fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 600 }}>02–06 / What&apos;s Holding Businesses Back</p>
          {ROWS.map((r) => (
            <article className="os-row" data-v={r.v} key={r.title}>
              <Num value={r.v} />
              <div>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                <div className="os-bar"><i style={{ ['--v' as string]: r.v / 100 }} /></div>
              </div>
            </article>
          ))}
        </div>

        <div className="os-section os-close">
          <p className="os-statement os-display">
            <Words text="Less to learn." /><br />
            <Words text="Less to manage." /><br />
            <Words text="More getting done." />
          </p>
        </div>

        <div className="os-section os-sign">
          <h2>The AI built for small business</h2>
          <svg viewBox="0 0 62 28" fill="none" stroke="currentColor" strokeWidth="2.6" role="img" aria-label="olo">
            <circle cx="14" cy="14" r="12" /><path d="M31 3v22" strokeLinecap="round" /><circle cx="48" cy="14" r="12" />
          </svg>
        </div>

        <div style={{ textAlign: "center", padding: "0 var(--pad) 40px" as string }}>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ink-soft)" as string, maxWidth: "60rem", margin: "0 auto" }}>
            Sources: Goldman Sachs 10,000 Small Businesses, March and October 2026; inTandem 2026 SMB Digital Adoption Report.
          </p>
        </div>
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: "var(--ink-soft)", padding: "0 var(--pad) 48px", opacity: 0.6 }}>
          © 2026 olo by SMB Automation Research LLC.
        </p>
      </section>
    </>
  );
}
