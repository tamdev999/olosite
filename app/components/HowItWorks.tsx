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
  "Connect Your Business.",
  "olo Finds Your Work.",
  "olo Readies the Work.",
  "olo Grows With Your Business.",
  "No Prompts. No Headaches.",
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
  const alpha = 1;
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
        padding: "0 clamp(24px, 5vw, 80px)",
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
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28, marginLeft: "auto", paddingRight: 0, maxWidth: 380, justifySelf: "end", transform: "translateX(350px)" }}>
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
          <span style={{ fontSize: "0.6em", color: "rgba(255,255,255,0.45)", marginLeft: 10 }}>
            / 05
          </span>
        </div>

        {/* Step title + conditional subheading — wrapped so flex gap doesn't split them */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 style={{
            margin: 0,
            fontSize: "clamp(24px, 2.6vw, 38px)",
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            color: "#f7f8f8",
            minHeight: "1.3em",
          }}>
            {step}
          </h3>
        </div>

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
            transform: `translateX(calc(${cardW} * -0.15 - 200px)) rotateY(-3.5deg)`,
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
                    background: i === 0
                      ? `
                        radial-gradient(ellipse 70% 60% at 15% 10%, rgba(255,255,255,0.45), transparent 55%),
                        radial-gradient(ellipse 50% 50% at 50% 50%, rgba(120,245,230,0.3), transparent 70%),
                        linear-gradient(135deg, #A8FBE8 0%, #4EEEE0 22%, #0FD8DC 48%, #00B4CC 72%, #0090B8 100%)
                      `
                      : i === 1
                      ? `radial-gradient(rgba(255,255,255,.09) 1px, transparent 1.4px) 0 0 / 18px 18px, linear-gradient(180deg, #1a1d20, #0f1214)`
                      : i === 2
                      ? `linear-gradient(135deg, #F0FCFF 0%, #B9EEFF 23%, #65CCF1 48%, #249FDF 75%, #0878C5 100%)`
                      : i === 3
                      ? `linear-gradient(135deg, #D6E8FF 0%, #92B8F5 25%, #4E7FE8 55%, #1A4FCC 80%, #0D32A8 100%)`
                      : i === 4
                      ? `linear-gradient(135deg, #E8F4FF 0%, #A8CFFF 22%, #5490F0 50%, #1A45CC 75%, #071A6E 100%)`
                      : `linear-gradient(145deg, ${light}, ${dark})`,
                    boxShadow: i === 1
                      ? `inset 0 0 0 3px rgba(70,235,150,.85), inset 0 2px 1px rgba(255,255,255,.2), 0 0 50px rgba(45,226,140,.22), 0 30px 60px rgba(0,0,0,.45)`
                      : `
                      inset 0 0 0 1px rgba(255,255,255,0.22),
                      inset 0 2px 1px rgba(255,255,255,0.55),
                      inset 0 -10px 24px rgba(0,20,80,0.25),
                      0 30px 60px rgba(0,0,0,0.45)
                    `,
                    willChange: "transform, opacity",
                    overflow: "hidden",
                    containerType: "inline-size",
                  }}
                >
                  {/* Gloss sheen */}
                  {i !== 1 && <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "inherit",
                    background: "linear-gradient(120deg, rgba(255,255,255,0.28), transparent 45%)",
                    pointerEvents: "none",
                  }} />}
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
                  {/* Card 1 content */}
                  {i === 0 && (
                    <div style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      justifyContent: "center",
                    }}>
                      {/* Integration graphic + text side by side */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8cqw 4cqw 8cqw 4cqw",
                        gap: "2cqw",
                      }}>
                        {/* Image — left */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/Cards/Card11.jpg"
                          alt="Olo integrations"
                          style={{
                            width: "62%",
                            borderRadius: "6cqw",
                            display: "block",
                            flexShrink: 0,
                          }}
                        />

                        {/* Text — right */}
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.8cqw",
                          textAlign: "right",
                        }}>
                          <p style={{
                            margin: 0,
                            fontFamily: "var(--font-ibm-plex-mono), monospace",
                            fontSize: "3.9cqw",
                            fontWeight: 400,
                            letterSpacing: "0.02em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            color: "#104750",
                          }}>
                            WORKS <span style={{ fontWeight: 700 }}>WITH</span><br />YOUR BUSINESS
                          </p>
                          <p style={{
                            margin: 0,
                            fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                            fontSize: "5.5cqw",
                            fontWeight: 650,
                            letterSpacing: "-0.055em",
                            lineHeight: 1.16,
                            color: "#082F37",
                          }}>
                            Google. QuickBooks.<br />Phone.<br />Website.
                          </p>
                          <p style={{
                            margin: 0,
                            ...serif,
                            fontFamily: '"Iowan Old Style", Baskerville, Georgia, serif',
                            fontSize: "4.8cqw",
                            fontWeight: 500,
                            fontStyle: "italic",
                            lineHeight: 1.4,
                            color: "#104750",
                          }}>
                            And everything<br />in between.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {i === 1 && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      containerType: "inline-size",
                      color: "#fff",
                    }}>
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        boxSizing: "border-box",
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr auto 1fr",
                        alignItems: "center",
                        padding: "5cqw 3.5cqw",
                      }}>
                        {[
                          { n: "01", title: "Signal", text: "Events within your business.",   icon: "/Cards/VectorsCard2/Tiles1.svg"  },
                          { n: "02", title: "Trace",  text: "Packages signals with context.", icon: "/Cards/VectorsCard2/Glass2.svg"  },
                          { n: "03", title: "Jev",    text: "Decides what\u2019s real work.", icon: "/Cards/VectorsCard2/Scales3.svg" },
                        ].flatMap((s, idx) => {
                          const step = (
                            <div key={s.n} style={{
                              display: "flex", flexDirection: "column",
                              alignItems: "center", textAlign: "center", gap: "2cqw",
                            }}>
                              <span style={{ font: "600 3cqw/1 ui-monospace, Menlo, monospace", opacity: 0.75 }}>{s.n}</span>
                              <h3 style={{ margin: 0, fontSize: "5.8cqw", fontWeight: 600, letterSpacing: "-0.01em", color: "#fff" }}>{s.title}</h3>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={s.icon} alt="" width={245} height={247} style={{ width: "100%", height: "26cqw", objectFit: "contain", display: "block" }} />
                              <p style={{ margin: "2cqw 0 0", fontSize: "3.4cqw", lineHeight: 1.3, opacity: 0.88 }}>{s.text}</p>
                            </div>
                          );
                          if (idx === 0) return [step];
                          return [
                            <div key={`d${idx}`} style={{
                              position: "relative", alignSelf: "stretch",
                              width: 1, margin: "6cqw 1.2cqw",
                              background: "rgba(255,255,255,.18)",
                            }}>
                              <span style={{
                                position: "absolute", top: "50%", left: "50%",
                                width: "2.4cqw", height: "2.4cqw",
                                borderTop: "0.6cqw solid #3dffa0",
                                borderRight: "0.6cqw solid #3dffa0",
                                transform: `translate(${idx === 1 ? "-80%" : "-65%"}, -50%) rotate(45deg)`,
                                display: "block",
                              }} />
                            </div>,
                            step,
                          ];
                        })}
                      </div>
                    </div>
                  )}

                  {i === 2 && (
                    <div style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      justifyContent: "center",
                      padding: "6cqw",
                    }}>
                      {/* Top row: image left, YOU'RE STILL THE BOSS. right */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4cqw",
                      }}>
                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/Cards/Card3New.png"
                          alt="Olo readies the work"
                          style={{
                            width: "72%",
                            flexShrink: 0,
                            borderRadius: "4cqw",
                            display: "block",
                          }}
                        />

                        {/* YOU'RE STILL THE BOSS. — each word on its own line */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginLeft: "-3cqw" }}>
                          {["YOU'RE", "STILL", "THE", "BOSS."].map((word, idx) => (
                            <p key={idx} style={{
                              margin: 0,
                              fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                              fontSize: "8cqw",
                              fontWeight: 900,
                              letterSpacing: "-0.07em",
                              lineHeight: 1.0,
                              color: idx >= 2 ? "#031D35" : "#063149",
                            }}>
                              {word}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Supporting copy — below the image */}
                      <p style={{
                        margin: "3cqw 0 0",
                        fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                        fontSize: "4.2cqw",
                        fontWeight: 600,
                        lineHeight: 1.25,
                        letterSpacing: "-0.035em",
                        color: "#07354B",
                      }}>
                        olo prepares work, then awaits your approval.
                      </p>
                    </div>
                  )}

                  {/* Card 4 content */}
                  {i === 3 && (
                    <div style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/Cards/Card44New.jpg"
                        alt="Olo grows with your business"
                        style={{
                          width: "91%",
                          display: "block",
                          borderRadius: "4cqw",
                          flexShrink: 0,
                          marginTop: "5cqw",
                        }}
                      />

                      {/* Text below image */}
                      <div style={{
                        width: "91%",
                        marginTop: "4cqw",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2cqw",
                      }}>
                        <p style={{
                          margin: 0,
                          fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                          fontSize: "6.5cqw",
                          fontWeight: 800,
                          letterSpacing: "-0.055em",
                          lineHeight: 1.04,
                          color: "#031224",
                        }}>
                          Not your typical AI.
                        </p>
                        <p style={{
                          margin: 0,
                          fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                          fontSize: "4cqw",
                          fontWeight: 550,
                          lineHeight: 1.35,
                          letterSpacing: "-0.025em",
                          color: "#071A3A",
                        }}>
                          olo keeps learning about your business and gaining new skills to take on more work.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card 5 content */}
                  {i === 4 && (
                    <div style={{
                      position: "relative",
                      zIndex: 2,
                      display: "flex",
                      flexDirection: "row",
                      height: "100%",
                      alignItems: "center",
                      padding: "6cqw 5cqw 6cqw 2cqw",
                      gap: "1%",
                    }}>
                      {/* Image — left */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/Cards/Card5.png"
                        alt="No prompts, no headaches"
                        style={{
                          width: "55%",
                          flexShrink: 0,
                          borderRadius: "4cqw",
                          display: "block",
                          marginTop: "18cqw",
                        }}
                      />

                      {/* Text — right */}
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "left",
                        justifyContent: "center",
                      }}>
                        {/* Headline */}
                        <p style={{
                          margin: 0,
                          fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                          fontSize: "4.8cqw",
                          fontWeight: 900,
                          letterSpacing: "-0.065em",
                          lineHeight: 1.0,
                          color: "#061B3C",
                        }}>
                          No need to tell<br />olo what to do.
                        </p>

                        {/* Supporting copy */}
                        <p style={{
                          margin: "2.5cqw 0 0",
                          fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                          fontSize: "3.6cqw",
                          fontWeight: 600,
                          lineHeight: 1.3,
                          letterSpacing: "-0.025em",
                          color: "#09264C",
                        }}>
                          olo finds the work, gathers the skills and context it needs to do it, then waits for your approval to execute it.
                        </p>

                        {/* Closing statement */}
                        <div style={{
                          marginTop: "3.5cqw",
                          display: "inline-block",
                          alignSelf: "flex-start",
                        }}>
                          <span style={{
                            fontFamily: "var(--font-geist-sans), Inter, sans-serif",
                            fontSize: "3.2cqw",
                            fontWeight: 750,
                            letterSpacing: "0.01em",
                            textTransform: "uppercase",
                            color: "#062B3B",
                            background: "#B8FFF1",
                            borderRadius: 7,
                            padding: "0.8cqw 1.5cqw",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}>
                            NO PROMPTS REQUIRED.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
