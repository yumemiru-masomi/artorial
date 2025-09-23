import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Artorial - AI絵画指導アプリ",
  description:
    "AI が段階的な描画手順を生成し、参考画像とテキスト指示を提供する初心者向け絵画学習プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head></head>
      <body className="antialiased min-h-screen">
        <div className="relative z-10">
          <Header />
          <main className="max-w-6xl mx-auto px-4 pb-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
