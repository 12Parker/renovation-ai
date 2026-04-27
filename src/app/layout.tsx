import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renovation AI",
  description: "AI-powered home renovation planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
