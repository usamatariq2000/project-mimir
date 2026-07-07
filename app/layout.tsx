import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black } from "next/font/google";
import SmoothScroll from "./components/SmoothScroll";
import SmoothCursor from "./components/SmoothCursor";
import ScrollGauge from "./components/ScrollGauge";
import LedgerBackdrop from "./components/LedgerBackdrop";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo_Black({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Mimir — The AI execution layer for software",
    template: "%s · Mimir",
  },
  description:
    "Mimir converts any software system into AI-executable tools, so AI agents can operate your business — safely, permissioned, and fully audited.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <SmoothCursor />
        <ScrollGauge />
        <LedgerBackdrop />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
