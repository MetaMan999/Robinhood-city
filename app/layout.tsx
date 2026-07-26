import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Real 3D Economic RPG",
  description:
    "Explore a living WebGL city, work real jobs, own businesses, and program its economy with HookTech.",
  openGraph: {
    title: "RHOOS CITY — Real 3D + Original Music",
    description:
      "A playable first-person economic RPG with modeled streets, traffic, citizens, original music, and programmable HookTech businesses.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY — Real 3D economic RPG",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — Real 3D + Original Music",
    description:
      "A playable first-person economic RPG with modeled streets, original music, jobs, businesses, and HookTech.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10121d",
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
