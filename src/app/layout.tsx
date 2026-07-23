import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@hellyeah/x-ray/next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { TRACKER_ID } from "@/lib/tracker-id";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealInfo — 预测市场 · 信息聚合",
  description: "用虚拟积分交易事件概率,聚合来自用户的个人推荐信息。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground tabular-nums">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Toaster richColors position="top-center" />
        <Analytics
          websiteId={TRACKER_ID}
          env={process.env.NEXT_PUBLIC_HELLYEAH_TRACKER_ENV}
        />
      </body>
    </html>
  );
}
