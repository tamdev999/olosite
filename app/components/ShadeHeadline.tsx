"use client";

import { useEffect, useRef, useState } from "react";

export default function ShadeHeadline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grad, setGrad] = useState(
    `radial-gradient(165px 135px at 50% 50%, #bdfff5 0%, #5bf0df 30%, #17c6ca 60%, #358cd7 85%, transparent 100%)`
  );

  useEffect(() => {
    function update(x: number, y: number) {
      setGrad(
        `radial-gradient(165px 135px at ${x}px ${y}px, #bdfff5 0%, #5bf0df 30%, #17c6ca 60%, #358cd7 85%, transparent 100%)`
      );
    }

    function onMouseMove(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Map full viewport position proportionally onto text bounds
      const xRatio = e.clientX / window.innerWidth;
      const yRatio = e.clientY / window.innerHeight;
      const x = xRatio * rect.width;
      const y = yRatio * rect.height;
      update(x, y);
    }

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const line1: React.CSSProperties = {
    display: "block",
    fontSize: "clamp(1.2rem, 2.5vw, 2.2rem)",
    fontWeight: 420,
    letterSpacing: "-0.045em",
    lineHeight: 1.12,
    color: "#CED0D8",
    fontOpticalSizing: "auto",
  } as React.CSSProperties;

  const line2: React.CSSProperties = {
    display: "block",
    fontSize: "clamp(2rem, 4.8vw, 4.2rem)",
    fontWeight: 730,
    letterSpacing: "-0.063em",
    lineHeight: 1.12,
    marginTop: "6px",
    color: "#F8F8FA",
    fontOpticalSizing: "auto",
  } as React.CSSProperties;

  const line1Content = (
    <>Not <em style={{ fontStyle: "italic", fontWeight: "inherit" }}>just</em> a new shade of AI.</>
  );
  const line2Content = (
    <>
      <span style={{ fontWeight: 500 }}>A new shade of </span>
      <span style={{ fontWeight: 730 }}>business.</span>
    </>
  );

  return (
    <div
      style={{
        textAlign: "center",
        paddingInline: 24,
        paddingBlock: "28px 0",
      }}
    >
      <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>

        {/* Base layer — both lines, solid colors */}
        <h2 style={{ margin: 0, userSelect: "none" }}>
          <span style={line1}>{line1Content}</span>
          <span style={line2}>{line2Content}</span>
        </h2>

        {/* Spotlight layer — only on line 2 */}
        <h2
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            margin: 0,
            color: "transparent",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {/* Line 1 — transparent, no spotlight */}
          <span style={{ ...line1, visibility: "hidden" }}>{line1Content}</span>
          {/* Line 2 — spotlight applied */}
          <span
            style={{
              ...line2,
              backgroundImage: grad,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >{line2Content}</span>
        </h2>

      </div>
    </div>
  );
}
