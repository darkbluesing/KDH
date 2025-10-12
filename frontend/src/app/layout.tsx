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

export const metadata: Metadata = {
  title: "K-POP Demon Hunters Shorts Hub",
  description:
    "K-POP Demon Hunters 세계관의 YouTube & TikTok 숏폼을 한 번에 탐색하는 시네마틱 허브",
  keywords: [
    "K-POP Demon Hunters",
    "Shorts",
    "YouTube",
    "TikTok Clips",
    "Fan Hub",
    "Dark Fantasy UI",
  ],
  metadataBase: new URL("https://kpop-demon-hunters.local"),
  openGraph: {
    title: "K-POP Demon Hunters Shorts Hub",
    description:
      "YouTube와 TikTok의 Demon Hunters 숏폼을 모아보는 7x20 그리드 허브",
    type: "website",
    locale: "ko_KR",
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
