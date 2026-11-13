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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              paddingInline: 14,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
              borderRadius: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
          >
            olo&apos;s Value to You
          </button>

          {/* Separator */}
          <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />

          <button
            onClick={open}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 32,
              paddingInline: 16,
              borderRadius: 9999,
              background: "none",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.01em",
              border: "1px solid rgba(255,255,255,0.25)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "none";
            }}
          >
            Get olo
          </button>
        </div>
      </div>
    </header>
  );
}
