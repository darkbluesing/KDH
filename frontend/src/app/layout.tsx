import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kpdh.world";
const SITE_NAME = "KPDH";
const SITE_TITLE = "KPDH | K-POP Demon Hunters Video Grid";
const SITE_DESC =
  "Dive into a dynamic grid of K-POP Demon Hunters short-form videos, behind-the-scenes cuts, and cinematic moments—updated for superfans across every platform.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: [
    "KPDH",
    "K-POP Demon Hunters",
    "short video archive",
    "KPOP",
    "video grid",
    "쇼츠",
    "케이팝",
    "데몬 헌터스",
    "shorts",
    "fan video collection",
    "cinematic clips",
    "dark pop action",
  ],
  applicationName: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KPDH — K-POP Demon Hunters Shorts",
      },
    ],
    locale: "en_US",
    alternateLocale: ["ko_KR"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: "large",
      maxVideoPreview: -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="bg-kdh-deep-black" lang="ko">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen text-slate-100`}
      >
        <div className="relative min-h-screen">{children}</div>
        <Script async src="https://www.tiktok.com/embed.js" />
      </body>
    </html>
  );
}
