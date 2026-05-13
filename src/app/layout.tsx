import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RM Tracker",
  description: "風險管理部門專案追蹤系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="h-full">
      <body className={`${inter.className} min-h-full`}>
        <NextTopLoader color="#4f46e5" height={3} showSpinner={false} shadow="0 0 8px #4f46e5" />
        {children}
      </body>
    </html>
  );
}
