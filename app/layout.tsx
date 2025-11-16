import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Mind Map AI",
  description: "Convert PDF notes to AI-powered mind maps with medical accuracy verification",
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
