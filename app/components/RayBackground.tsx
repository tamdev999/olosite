"use client";

// Each beam defined by two endpoints of its center line
// Rendered as 3 stacked rects (wide feather, mid, core) centered on that line
// No distant pivot rotation — geometry is exact and predictable

const DEG = Math.PI / 180;

function beamPath(
  x1: number, y1: number,
  x2: number, y2: number,
  halfW: number
): string {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  // perpendicular unit vector
  const px = (-dy / len) * halfW;
  const py = (dx / len) * halfW;
  return [
    `${x1 + px},${y1 + py}`,
    `${x2 + px},${y2 + py}`,
    `${x2 - px},${y2 - py}`,
    `${x1 - px},${y1 - py}`,
  ].join(" ");
}

// Beam center lines (start, end) — tuned to match reference screenshot
// Left cluster: enters top-left, exits bottom-left of player
// Right cluster: enters top-right, exits bottom-right of player
const BEAMS = [
  // TEAL — left outer
  { x1: -140, y1: -80,  x2: 60,   y2: 980,  wideW: 280, midW: 110, coreW: 28, fColor: "#2DD4BF", fOp: 0.18, cColor: "#CCFBF1", cOp: 0.55, pulse: "rayPulse1", dur: "10s", delay: "0s" },
  // EMERALD — left inner
  { x1: -20,  y1: -80,  x2: 160,  y2: 980,  wideW: 220, midW: 85,  coreW: 20, fColor: "#10B981", fOp: 0.14, cColor: "#A7F3D0", cOp: 0.45, pulse: "rayPulse2", dur: "13s", delay: "2s" },
  // CYAN — right outer
  { x1: 1380, y1: -80,  x2: 1560, y2: 980,  wideW: 260, midW: 100, coreW: 24, fColor: "#06B6D4", fOp: 0.17, cColor: "#A5F3FC", cOp: 0.52, pulse: "rayPulse3", dur: "9s",  delay: "3.5s" },
  // BLUE — right inner
  { x1: 1500, y1: -80,  x2: 1660, y2: 980,  wideW: 200, midW: 78,  coreW: 18, fColor: "#1D4ED8", fOp: 0.14, cColor: "#BAE6FD", cOp: 0.42, pulse: "rayPulse4", dur: "11s", delay: "5s"  },
];

export default function RayBackground() {
  return (
    <>
      <style>{`
        @keyframes rayPulse1 { 0%,100%{opacity:0.82} 50%{opacity:1.0} }
        @keyframes rayPulse2 { 0%,100%{opacity:0.65} 50%{opacity:0.85} }
        @keyframes rayPulse3 { 0%,100%{opacity:0.78} 50%{opacity:1.0} }
        @keyframes rayPulse4 { 0%,100%{opacity:0.55} 50%{opacity:0.75} }
        @media (prefers-reduced-motion: reduce) {
          .ray-beam { animation: none !important; }
        }
      `}</style>

      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="fBlur36" x="-80%" y="-30%" width="260%" height="160%">
            <feGaussianBlur stdDeviation="48"/>
          </filter>
          <filter id="fBlur18" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="24"/>
          </filter>
          <filter id="fBlur7" x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur stdDeviation="9"/>
          </filter>
        </defs>

        {BEAMS.map((b, i) => (
          <g
            key={i}
            className="ray-beam"
            style={{ animation: `${b.pulse} ${b.dur} ease-in-out infinite ${b.delay}` }}
          >
            {/* Wide feather */}
            <polygon
              points={beamPath(b.x1, b.y1, b.x2, b.y2, b.wideW)}
              fill={b.fColor}
              fillOpacity={b.fOp}
              filter="url(#fBlur36)"
            />
            {/* Mid feather */}
            <polygon
              points={beamPath(b.x1, b.y1, b.x2, b.y2, b.midW)}
              fill={b.fColor}
              fillOpacity={b.fOp * 1.4}
              filter="url(#fBlur18)"
            />
            {/* Bright core */}
            <polygon
              points={beamPath(b.x1, b.y1, b.x2, b.y2, b.coreW)}
              fill={b.cColor}
              fillOpacity={b.cOp}
              filter="url(#fBlur7)"
            />
          </g>
        ))}
      </svg>
    </>
  );
}
