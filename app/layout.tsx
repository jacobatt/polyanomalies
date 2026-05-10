import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import "./globals.css";

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PolyAnomalies",
    template: "%s · PolyAnomalies",
  },
  description: "Whale & anomaly monitor for Polymarket prediction markets.",
  openGraph: {
    title: "PolyAnomalies",
    description: "Whale & anomaly monitor for Polymarket prediction markets.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PolyAnomalies",
    description: "Whale & anomaly monitor for Polymarket prediction markets.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-density="comfortable"
      className={`${sans.variable} ${mono.variable} h-full`}
    >
      <body className="h-full flex flex-col">
        <RealtimeProvider>{children}</RealtimeProvider>
      </body>
    </html>
  );
}
