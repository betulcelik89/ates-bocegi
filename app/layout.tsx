import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ateş Böceği | TEGV Gönüllü Portalı",
  description: "Bir Çocuk Değişir, Türkiye Gelişir.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}