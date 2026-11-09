'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

const CSS = `
.m-wrap{padding:28px 0 44px;text-align:center;background:#070a10;color:#f7f8f8}
.m-eyebrow{margin:0 0 10px;font-size:15px;opacity:.6;font-family:var(--font-ibm-plex-mono),monospace;letter-spacing:0.08em}
.m-head{margin:0 auto 24px;padding:0 24px;max-width:22rem;font-weight:300;font-size:26px;line-height:1.2;color:#f7f8f8}

.m-track{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:20px 7vw 28px;
  scrollbar-width:none;-webkit-overflow-scrolling:touch}
.m-track::-webkit-scrollbar{display:none}

.m-card{flex:0 0 86vw;scroll-snap-align:center;
  opacity:.55;transform:scale(.96);transition:opacity .3s,transform .3s}
.m-card.on{opacity:1;transform:none}

.m-counter{margin-top:26px;font-size:44px;font-weight:300;line-height:1;color:#2de2d0}
.m-counter small{font-size:14px;opacity:.5;margin-left:6px}
.m-title{margin:10px 0 18px;font-size:24px;color:#f7f8f8;padding:0 24px}
.m-bars{display:flex;justify-content:center;gap:10px}
.m-bars button{all:unset;width:44px;height:24px;display:flex;align-items:center;cursor:pointer}
.m-bars span{width:100%;height:3px;border-radius:3px;background:rgba(255,255,255,.18);transition:background .4s}
.m-bars .on span{background:#2de2d0}
`;

// Scales desktop card content down to fit a phone screen
function Scaled({ children, w = 570, h = 499 }: { children: ReactNode; w?: number; h?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0.58);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setS(e.contentRect.width / w));
    ro.observe(box.current!);
    return () => ro.disconnect();
  }, [w]);

  return (
    <div ref={box} style={{ width: '100%', aspectRatio: `${w} / ${h}`, position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: w, height: h,
        transformOrigin: '0 0', transform: `scale(${s})`,
        ['--card-w' as string]: `${w}px`,
        ['--card-h' as string]: `${h}px`,
      }}>
        {children}
      </div>
    </div>
  );
}

export function MobileCards({ cards, titles }: { cards: ReactNode[]; titles: string[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = track.current!;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      }),
      { root, threshold: 0.6 }
    );
    root.querySelectorAll('[data-i]').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const go = (n: number) =>
    track.current!.children[n].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <style>{CSS}</style>
      <div className="m-wrap">
        <p className="m-eyebrow">[Step by Step]</p>
        <h2 className="m-head">Here&apos;s what the future of business really looks like.</h2>

        <div className="m-track" ref={track}>
          {cards.map((c, i) => (
            <div key={i} data-i={i} className={'m-card' + (i === active ? ' on' : '')}>
              <Scaled>{c}</Scaled>
            </div>
          ))}
        </div>

        <div className="m-counter">{pad(active + 1)}<small>/ {pad(cards.length)}</small></div>
        <div className="m-title">{titles[active]}</div>
        <div className="m-bars">
          {cards.map((_, i) => (
            <button key={i} aria-label={`Step ${i + 1}`} className={i <= active ? 'on' : ''} onClick={() => go(i)}>
              <span />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
