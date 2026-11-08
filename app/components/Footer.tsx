"use client";

export default function Footer() {

  return (
    <footer
      style={{
        width: "100%",
        background: `
          linear-gradient(to bottom, rgba(0,0,0,.35), transparent 35%),
          linear-gradient(160deg, #3df2dc 0%, #1fc9c4 45%, #1478c8 100%)
        `,
        color: "#04120f",
        boxSizing: "border-box",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px clamp(32px, 7vw, 120px) 48px",
      }}
    >
      {/* Top */}
      <div style={{ textAlign: "center" }}>
      </div>

      {/* Bottom — legal */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        opacity: 0.5,
        fontSize: 13,
        fontWeight: 500,
      }}>
        <span>© 2026 olo by SMB Automation Research LLC.</span>
      </div>
    </footer>
  );
}
