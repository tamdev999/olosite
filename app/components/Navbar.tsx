"use client";

import Image from "next/image";
import { useModal } from "./ModalContext";

export default function Navbar() {
  const { open } = useModal();
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 56,
        display: "flex",
        alignItems: "center",
        background: "#09090c",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      {/* Grain overlay — matches site bg grain */}
      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px",
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }} />
      <div
        style={{
          width: "100%",
          paddingInline: "calc(50% - 420px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/logo.svg"
            alt="olo"
            width={62}
            height={31}
            style={{ objectFit: "contain" }}
            priority
          />
        </a>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => {
              const calc = document.querySelector('olo-calculator');
              const cta = calc?.shadowRoot?.querySelector('.cta') as HTMLElement | null;
              cta?.click();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 32,
              paddingInline: 16,
              borderRadius: 9999,
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.15s",
              boxShadow: "0 0 16px rgba(34,197,94,0.4)",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            olo&apos;s Value to You
          </button>

          <button
            onClick={open}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 32,
              paddingInline: 16,
              borderRadius: 9999,
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.15s",
              boxShadow: "0 0 16px rgba(59,130,246,0.45)",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Get olo
          </button>
        </div>
      </div>
    </header>
  );
}
