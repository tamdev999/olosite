import VideoStage from "./components/VideoStage";
import ShadeHeadline from "./components/ShadeHeadline";
import ShadePanel from "./components/ShadePanel";
import HowItWorks from "./components/HowItWorks";
import OloStats from "./components/OloStats";

export default function Home() {
  return (
    <>
      {/* ── Main content — sits above the footer, slides up to reveal it ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          paddingTop: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          color: "#f7f8f8",
          overflow: "visible",
          background: "#09090c",
        }}
      >
        {/* Hero headline */}
        <div style={{ textAlign: "center", paddingInline: 24, position: "relative", zIndex: 2 }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#f7f8f8",
              lineHeight: 1,
            }}
          >
            <span style={{
              display: "block",
              fontSize: "clamp(2.8rem, 6.5vw, 5.2rem)",
              fontWeight: 400,
              marginBottom: "0.08em",
              transform: "skewX(-4deg)",
            }}>
              ChatGPT, but
            </span>
            <span
              style={{
                display: "inline-block",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                background: "#2DD4BF",
                color: "#07080a",
                borderRadius: 14,
                paddingInline: "0.25em",
                paddingBlock: "0.1em",
              }}
            >
              Built for Business
            </span>
          </h1>
        </div>

        {/* Video stage */}
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <VideoStage />
        </div>

        {/* Divider */}
        <div style={{
          width: "60%", maxWidth: 520, height: 1,
          background: "rgba(255,255,255,0.06)", borderRadius: 1,
          marginTop: 48, marginBottom: 96, position: "relative", zIndex: 2,
        }} />

        {/* Sub-hero headline */}
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <ShadeHeadline />
        </div>

        {/* Shade panel */}
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <ShadePanel />
        </div>

        {/* Divider */}
        <div style={{
          width: "60%", maxWidth: 520, height: 1,
          background: "rgba(255,255,255,0.1)", borderRadius: 1,
          marginTop: 0, marginBottom: 96, position: "relative", zIndex: 2,
        }} />

        {/* How It Works */}
        <div style={{ position: "relative", zIndex: 2, width: "100%" }}>
          <HowItWorks />
        </div>

        {/* Divider below HowItWorks */}
        <div style={{
          width: "60%", maxWidth: 520, height: 1,
          background: "rgba(255,255,255,0.08)", borderRadius: 1,
          marginTop: 48, marginBottom: 48, position: "relative", zIndex: 2,
        }} />
      </div>

      {/* OloStats research section */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <OloStats />
      </div>
    </>
  );
}
