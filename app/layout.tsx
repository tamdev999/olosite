import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "./components/Navbar";
import { ModalProvider } from "./components/ModalContext";
import EarlyAccessModal from "./components/EarlyAccessModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["300", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://meetolo.ai"),
  title: "olo | Autonomous AI for Small Business",
  description: "No prompts. No babysitting. olo finds the work in your business, gets it done, and waits for your approval.",
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "olo | Autonomous AI for Small Business",
    description: "No prompts. No babysitting. olo finds the work in your business, gets it done, and waits for your approval.",
    url: "https://meetolo.ai",
    siteName: "olo",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "olo: Autonomous AI for Small Business" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} h-full antialiased`}
      style={{ backgroundColor: '#09090c' }}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#09090c' }}>
        <Script src="/olo-calculator.js" strategy="afterInteractive" />
        <Script src="/olo-theatre.js" strategy="afterInteractive" />
        <ModalProvider>
          <Navbar />
          {children}
          <EarlyAccessModal />
        </ModalProvider>
      </body>
    </html>
  );
}
