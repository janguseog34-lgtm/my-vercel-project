import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모락한끼",
  description: "Next.js delivery app with Prisma and PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
