import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bay to Bay AI Command Center",
  description: "Every lead. Every organization. One command center.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
