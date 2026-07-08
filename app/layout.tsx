import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: CSS module import for Next.js global stylesheet
import "./globals.css";
import DynamicProvider from "@/context/DynamicProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title:       "Card Tracker — Trade Baseball Cards Like Stocks",
  description: "Buy and sell shares of PSA-graded baseball cards with a real order book, live MLB signals, and USDC settlement on Base.",
  keywords:    ["baseball cards", "PSA", "MLB", "crypto", "USDC", "Base", "trading"],
  openGraph: {
    title:       "Card Tracker",
    description: "Trade baseball cards like stocks — order book, MLB signals, USDC on Base",
    url:         "https://sentient-capital.vercel.app",
    siteName:    "Card Tracker",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Card Tracker",
    description: "Trade baseball cards like stocks — order book, MLB signals, USDC on Base",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* PWA */}
        <meta name="viewport"                               content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="mobile-web-app-capable"                content="yes" />
        <meta name="apple-mobile-web-app-capable"          content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title"            content="Card Tracker" />
        <meta name="theme-color"                           content="#2563eb" />
        <link rel="manifest"                               href="/manifest.json" />

        {/* Icons */}
        <link rel="icon"             href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full bg-gray-50" suppressHydrationWarning>
        <DynamicProvider>
          {children}
        </DynamicProvider>
      </body>
    </html>
  );
}