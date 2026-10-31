"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const serif: React.CSSProperties = {
  fontFamily: '"Iowan Old Style", Baskerville, Georgia, serif',
  fontStyle: "italic",
  fontWeight: 400,
  letterSpacing: "-0.05em",
};

const TITLES = [
  "Just start chatting.",
  "Olo gets to know your business.",
  "Discover what matters.",
  "Turn ideas into action.",
  "Keep moving forward.",
];
const COUNT = TITLES.length;

// Animation config — mirrors the reference
const SHIFT = 0.42;   // sideways travel (fraction of card width)
const LIFT  = 0.07;   // lifts toward viewer
const RAISE = 0.025;  // slight upward drift
const MOVE  = 1;      // timeline units per transition
const HOLD  = 0.6;    // pause between transitions
const TINT  = [0, 0.10, 0.18, 0.26, 0.32]; // dimming by depth
const SCROLL_PER_STEP = 1.3; // viewport heights per transition

// Card colors — same formula as reference
function slotColors(i: number) {
  const t = i / (COUNT - 1);
  const alpha = 0.95 - t * 0.2;
  return {
    light: `hsl(${172 + t * 48} 85% ${72 - t * 16}% / ${alpha})`,
    dark:  `hsl(${180 + t * 42} 80% ${56 - t * 18}% / ${alpha})`,
  };
}

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const sectionRef  = useRef<HTMLDivElement>(null);
  const stackRef    = useRef<HTMLDivElement>(null);
  const glowRef     = useRef<HTMLDivElement>(null);
  const cardRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const tintRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const sheenRefs   = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const stack   = stackRef.current;
    const glow    = glowRef.current;
    if (!section || !stack || !glow) return;

    const cards  = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const tints  = tintRefs.current.filter(Boolean) as HTMLDivElement[];
    const sheens = sheenRefs.current.filter(Boolean) as HTMLDivElement[];
    if (cards.length < COUNT) return;

    const depthTint = (d: number) => TINT[Math.min(d, TINT.length - 1)];

    // Initial tint and sheen positions
    tints.forEach((el, n) => gsap.set(el, { opacity: depthTint(n) }));
    sheens.forEach(el => gsap.set(el, { xPercent: -160, skewX: -18 }));

    const ends: number[] = [];

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * SCROLL_PER_STEP * (COUNT - 1)}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    let t = HOLD;
    for (let i = 0; i < COUNT - 1; i++) {
      const card = cards[i];
      const w = () => card.offsetWidth;

      // 1. Front card glides right, drifts up, lifts toward viewer
      tl.to(card, {
        x: () => w() * SHIFT,
        y: () => -w() * RAISE,
        z: () => w() * LIFT,
        duration: MOVE,
        ease: "power3.inOut",
      }, t);

      // 2. Fade out after movement begins
      tl.to(card, { opacity: 0, duration: MOVE * 0.7, ease: "power1.in" }, t + MOVE * 0.3);

      // 3. Sheen sweep
      tl.to(sheens[i], { xPercent: 460, duration: MOVE, ease: "power2.inOut" }, t);

      // 4. Cards behind brighten as they come forward
      for (let j = i + 1; j < COUNT; j++) {
        tl.to(tints[j], { opacity: depthTint(j - i - 1), duration: MOVE, ease: "power2.inOut" }, t);
      }

      ends.push(t + MOVE);
      t += MOVE + HOLD;
    }

    // Glow drifts slowly across the whole scroll
    tl.fromTo(glow, { xPercent: -4 }, { xPercent: 4, ease: "none", duration: t }, 0);

    // Trailing hold on last card
    tl.set({}, {}, t);

    // Derive step from playhead
    tl.eventCallback("onUpdate", () => {
      const time = tl.time();
      setActiveStep(ends.filter(e => time >= e - 0.001).length);
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  const step = TITLES[activeStep];

  // Card width for proportional sizing — matches reference calc
  const cardW = "clamp(250px, 36vw, 560px)";
  const persp = "calc(clamp(250px, 36vw, 560px) * 2.86)";
  const horizon = "calc(clamp(250px, 36vw, 560px) * 5.7)";
  const stepX = "calc(clamp(250px, 36vw, 560px) * 0.136)";
  const stepY = "calc(clamp(250px, 36vw, 560px) * 0.021)";
  const stepZ = "calc(clamp(250px, 36vw, 560px) * -0.027)";

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.5fr) 1.3fr",
        alignItems: "center",
        padding: "0 clamp(24px, 5vw, 80px) 0 clamp(260px, 26vw, 420px)",
        gap: 0,
        columnGap: 0,
        boxSizing: "border-box",
        background: "#070a10",
      }}
    >
      {/* Glow — drifts with scroll */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          inset: "-8% -10%",
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 50% 45% at 68% 48%, rgba(40,140,255,0.26), transparent 70%),
            radial-gradient(ellipse 38% 38% at 55% 55%, rgba(60,240,220,0.20), transparent 70%)
          `,
          willChange: "transform",
        }}
      />

      {/* ── Left column ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28, marginLeft: "auto", paddingRight: 0, maxWidth: 380 }}>
        {/* Eyebrow */}
        <p style={{
          margin: 0,
          fontFamily: "var(--font-ibm-plex-mono), monospace",
          fontSize: 19,
          fontWeight: 300,
          letterSpacing: "0.08em",
          color: "#B5BFCC",
        }}>
          <span style={{ color: "#2DD4C4" }}>[</span>
          Step by Step
          <span style={{ color: "#2DD4C4" }}>]</span>
        </p>

        {/* Headline */}
        <h2 style={{
          margin: 0,
          fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
          fontWeight: 400,
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
          color: "#f7f8f8",
        }}>
          Here&apos;s what the{" "}
          <span style={{ ...serif, color: "#2DD4BF" }}>future</span>{" "}
          of business{" "}
          <span style={{ ...serif }}>really</span>{" "}
          looks like.
        </h2>

        {/* Rule */}
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.12)" }} />

        {/* Counter */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{
            fontSize: "clamp(44px, 5vw, 72px)",
            fontWeight: 300,
            letterSpacing: "-0.05em",
            color: "#2DD4BF",
            lineHeight: 1,
          }}>
            {String(activeStep + 1).padStart(2, "0")}
          </span>
          <span style={{ fontSize: "0.38em", color: "rgba(255,255,255,0.45)", marginLeft: 10 }}>
            / 05
          </span>
        </div>

        {/* Step title */}
        <h3 style={{
          margin: "0 0 30px",
          fontSize: "clamp(24px, 2.6vw, 38px)",
          fontWeight: 400,
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
          color: "#f7f8f8",
          minHeight: "1.3em",
        }}>
          {step}
        </h3>

        {/* Progress bars */}
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {Array.from({ length: COUNT }).map((_, i) => (
            <div key={i} style={{
              width: 28,
              height: 2,
              borderRadius: 1,
              position: "relative",
              overflow: "hidden",
              background: "rgba(255,255,255,0.16)",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: "#2DD4BF",
                transformOrigin: "left",
                transform: `scaleX(${i <= activeStep ? 1 : 0})`,
                transition: "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Right column — 3D fan stack ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "grid",
          placeItems: "center",
          perspective: persp,
          perspectiveOrigin: `50% calc(50% - ${horizon})`,
        }}
      >
        <div
          ref={stackRef}
          style={{
            position: "relative",
            width: cardW,
            height: `calc(${cardW} * 0.875)`,
            transformStyle: "preserve-3d",
            transform: `translateX(calc(${cardW} * -0.12)) rotateY(-3.5deg)`,
          }}
        >
          {Array.from({ length: COUNT }).map((_, i) => {
            const { light, dark } = slotColors(i);
            return (
              // Slot — fixed fan position, never animated
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  transformStyle: "preserve-3d",
                  transform: `translate3d(calc(${i} * ${stepX}), calc(${i} * ${stepY}), calc(${i} * ${stepZ}))`,
                }}
              >
                {/* Card — what GSAP moves */}
                <div
                  ref={el => { cardRefs.current[i] = el; }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 34,
                    background: `linear-gradient(145deg, ${light}, ${dark})`,
                    boxShadow: `
                      inset 0 0 0 1px rgba(255,255,255,0.22),
                      inset 0 2px 1px rgba(255,255,255,0.55),
                      inset 0 -10px 24px rgba(0,20,80,0.25),
                      0 30px 60px rgba(0,0,0,0.45)
                    `,
                    willChange: "transform, opacity",
                    overflow: "hidden",
                  }}
                >
                  {/* Gloss sheen */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    background: "linear-gradient(120deg, rgba(255,255,255,0.28), transparent 45%)",
                    pointerEvents: "none",
                  }} />
                  {/* Depth tint */}
                  <div
                    ref={el => { tintRefs.current[i] = el; }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#031232",
                      opacity: 0,
                      pointerEvents: "none",
                    }}
                  />
                  {/* Sheen sweep */}
                  <div
                    ref={el => { sheenRefs.current[i] = el; }}
                    style={{
                      position: "absolute",
                      top: "-25%",
                      bottom: "-25%",
                      left: 0,
                      width: "38%",
                      background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.5), transparent)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
