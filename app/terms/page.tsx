import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | olo",
  description: "Terms of Service for olo by SMB Automation Research LLC.",
};

const prose: React.CSSProperties = {
  fontFamily: "var(--font-geist-sans), Inter, sans-serif",
  color: "#d0d6e0",
  lineHeight: 1.7,
  fontSize: 16,
};

const h1Style: React.CSSProperties = {
  fontSize: "clamp(2rem, 4vw, 3rem)",
  fontWeight: 700,
  letterSpacing: "-0.04em",
  color: "#f7f8f8",
  margin: "0 0 8px",
};

const h3Style: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#f7f8f8",
  margin: "2em 0 0.5em",
};

const dateStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#62666d",
  marginBottom: "2.5rem",
};

export default function Terms() {
  return (
    <div style={{ background: "#09090c", minHeight: "100vh", paddingTop: 100, paddingBottom: 120 }}>
      <div style={{ maxWidth: 720, marginInline: "auto", paddingInline: 24, ...prose }}>
        <h1 style={h1Style}>Terms of Service</h1>
        <p style={dateStyle}>Effective Date: 11/14/2026</p>

        <p>Welcome to olo, an autonomous AI operating system for small businesses.</p>
        <p style={{ marginTop: "1em" }}>These Terms govern your use of meetolo.ai, operated by SMB Automation Research LLC, a Florida limited liability company.</p>
        <p style={{ marginTop: "1em" }}>By using our website, you agree to these Terms.</p>

        <h3 style={h3Style}>1. About olo</h3>
        <p>olo is currently in development and pre-launch.</p>
        <p style={{ marginTop: "1em" }}>Our website provides information about our planned product and allows visitors to express interest in early access.</p>
        <p style={{ marginTop: "1em" }}>Joining our early-access list does not guarantee access to the product, a launch date, specific features, or pricing.</p>
        <p style={{ marginTop: "1em" }}>We may change our plans as development continues.</p>

        <h3 style={h3Style}>2. Business Calculator</h3>
        <p>Our website may provide calculators estimating potential time savings, cost savings, or additional revenue.</p>
        <p style={{ marginTop: "1em" }}><strong style={{ color: "#f7f8f8" }}>All calculator results are estimates only.</strong></p>
        <p style={{ marginTop: "1em" }}>They are based on information you provide and general assumptions. Results are not financial advice, promises, or guarantees of actual business outcomes.</p>
        <p style={{ marginTop: "1em" }}>Your results may differ significantly from the estimates shown. You are responsible for your own business and financial decisions.</p>

        <h3 style={h3Style}>3. Intellectual Property</h3>
        <p>The olo name, branding, website content, designs, and related materials belong to SMB Automation Research LLC.</p>
        <p style={{ marginTop: "1em" }}>You may use our website for its intended purpose, but you may not copy, reproduce, or commercially exploit our materials without permission.</p>

        <h3 style={h3Style}>4. No Warranties</h3>
        <p>Our website and calculator are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;</p>
        <p style={{ marginTop: "1em" }}>To the extent permitted by law, we make no warranties about their accuracy, reliability, availability, or suitability for any particular purpose.</p>

        <h3 style={h3Style}>5. Limitation of Liability</h3>
        <p>To the fullest extent permitted by law, SMB Automation Research LLC is not liable for indirect, incidental, special, or consequential damages, including lost profits or business opportunities, arising from your use of our website or calculator.</p>
        <p style={{ marginTop: "1em" }}>Nothing in these Terms limits liability where doing so would be prohibited by law.</p>

        <h3 style={h3Style}>6. Changes to These Terms</h3>
        <p>We may update these Terms from time to time. Updated Terms will be posted on this page with a new effective date.</p>
        <p style={{ marginTop: "1em" }}>Your continued use of the website after changes take effect means you accept the updated Terms.</p>

        <h3 style={h3Style}>7. Governing Law</h3>
        <p>These Terms are governed by the laws of the State of Florida.</p>
        <p style={{ marginTop: "1em" }}>Any legal disputes relating to these Terms will be handled in the state courts of Miami-Dade County, Florida, or the federal court serving that county, to the extent permitted by law.</p>

        <h3 style={h3Style}>8. Contact</h3>
        <p><strong style={{ color: "#f7f8f8" }}>SMB Automation Research LLC</strong></p>
        <p style={{ marginTop: "0.5em" }}>Email: <a href="mailto:josh@meetolo.ai" style={{ color: "#2DD4BF", textDecoration: "none" }}>josh@meetolo.ai</a></p>
        <p>Mailing Address: 78 SW 7th St, Miami, FL 33130</p>
        <p>Website: <a href="https://meetolo.ai" style={{ color: "#2DD4BF", textDecoration: "none" }}>https://meetolo.ai</a></p>
      </div>
    </div>
  );
}
