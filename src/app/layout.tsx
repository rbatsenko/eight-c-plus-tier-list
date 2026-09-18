import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "8C+ Tier List",
  description:
    "A public, collaboratively edited tier list of the world's 8C+ boulder problems. Anyone can drag, anyone can add.",
  openGraph: {
    title: "8C+ Tier List",
    description:
      "A public, collaboratively edited tier list of the world's 8C+ boulder problems.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased text-zinc-100">{children}</body>
    </html>
  );
}
