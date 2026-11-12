"use client";

import { useRef, useState } from "react";

export default function VideoStage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const radius = 18;

  function toggleSound() {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      paddingInline: 24,
      marginTop: 48,
      marginBottom: 80,
    }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 860 }}>

        {/* Rays PNG */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rays2.png"
          alt=""
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "140%",
            maxWidth: "none",
            height: "125%",
            objectFit: "fill",
            pointerEvents: "none",
            opacity: 0.7,
            display: "block",
          }}
        />
        <div style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: radius,
          background: "#0c0d0f",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
          filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.38))",
        }}>
          <video
            ref={videoRef}
            autoPlay muted loop playsInline
            src="https://bwydxgx4rhhxip51.public.blob.vercel-storage.com/olo_final.mp4" poster={undefined}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none", zIndex: 1,
          }} />
          <button
            onClick={toggleSound}
            style={{
              position: "absolute", bottom: 16, right: 16, zIndex: 3,
              display: "inline-flex", alignItems: "center", gap: 6,
              height: 28, paddingInline: 12, borderRadius: 9999,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.75)",
              fontSize: 11, fontWeight: 500, letterSpacing: "0.03em",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              {muted ? (
                <path d="M9 3L5 6H2v4h3l4 3V3zM13 6l-3 3M10 6l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M9 3L5 6H2v4h3l4 3V3zM12 6.5a3 3 0 010 3M14 5a5.5 5.5 0 010 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
            {muted ? "Sound On" : "Sound Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
