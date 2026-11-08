import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
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
  title: "olo",
  description: "The business AI you've been waiting for. Built for business owners with better things to do.",
  icons: {
    icon: "/LOGO.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} h-full antialiased`}
      style={{ backgroundColor: '#09090c' }}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#09090c' }}>
        <ModalProvider>
          <Navbar />
          {children}
          <EarlyAccessModal />
        </ModalProvider>
      </body>
    </html>
  );
}
