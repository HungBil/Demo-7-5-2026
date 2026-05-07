import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cổng TTĐT Bộ Quốc phòng Việt Nam",
  description: "Trang thông tin điện tử Bộ Quốc phòng Việt Nam - Tin tức quân sự, quốc phòng, an ninh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
