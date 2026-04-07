import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindergarten Outreach Tracker",
  description: "Mini app za pracenje komunikacije s vrticima"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
