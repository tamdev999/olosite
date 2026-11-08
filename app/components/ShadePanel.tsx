import Image from "next/image";

const serif: React.CSSProperties = {
  fontFamily: '"Iowan Old Style", Baskerville, Georgia, serif',
  fontStyle: "italic",
  fontWeight: 400,
  letterSpacing: "-0.077em",
};

export default function ShadePanel() {
  return (
    <section
      className="shade-panel"
      style={{
        width: "100%",
        maxWidth: 1280,
        marginInline: "auto",
        paddingInline: 48,
        paddingBlock: "96px 140px",
        display: "grid",
        gridTemplateColumns: "1fr 1.6fr",
        gap: 160,
        alignItems: "center",
      }}
    >
      {/* ── Left column ── */}
      <div className="shade-text" style={{ display: "flex", flexDirection: "column", gap: 48 }}>

        {/* Big headline */}
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(2.6rem, 5vw, 4.6rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "#f7f8f8",
          }}
        >
          <span style={{ fontWeight: 350 }}>Now picture the </span>
          <span style={{ ...serif, color: "#2DD4BF" }}>future</span>
          <span style={{ fontWeight: 350 }}> of</span><br />business.
        </h2>

        {/* Body copy */}
        <p
          style={{
            margin: 0,
            lineHeight: 1.32,
            letterSpacing: "-0.045em",
            maxWidth: 380,
          }}
        >
          <span style={{
            fontSize: 19,
            fontWeight: 420,
            color: "#AAADB8",
            fontStyle: "normal",
          }}>
            We&apos;re guessing you didn&apos;t imagine{" "}
          </span>
          <span style={{
            fontSize: 28,
            fontWeight: 430,
            fontStyle: "italic",
            color: "#B0D9ED",
          }}>
            <strong style={{ fontWeight: 400 }}>learning, setting up,</strong> and then <strong style={{ fontWeight: 400 }}>babysitting</strong> a <strong style={{ fontWeight: 400 }}>dozen chatboxes.</strong>
          </span>
        </p>

        {/* Neither did we */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.55em", marginTop: 8 }}>
          <span
            style={{
              ...serif,
              fontSize: "clamp(2.8rem, 5.2vw, 4.6rem)",
              color: "#f7f8f8",
              marginRight: "0.08em",
            }}
          >
            Neither
          </span>
          <span
            style={{
              fontSize: "clamp(2.8rem, 5.2vw, 4.6rem)",
              fontWeight: 500,
              letterSpacing: "-0.04em",
              color: "#f7f8f8",
            }}
          >
            {" "}did{" "}
          </span>
          <span
            style={{
              fontSize: "clamp(2.8rem, 5.2vw, 4.6rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#2DD4BF",
            }}
          >
            we.
          </span>
        </div>

        {/* Tagline removed */}

      </div>

      {/* ── Right column — swatch graphic ── */}
      <div className="shade-graphic" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", overflow: "visible" }}>

        {/* Image — sits above the glow */}
        <Image
          src="/ColorSwatch.png"
          alt="Olo color swatches"
          width={2896}
          height={2172}
          style={{ width: "140%", height: "auto", maxWidth: "none", position: "relative", zIndex: 1 }}
          priority
          unoptimized
        />
      </div>

    </section>
  );
}
