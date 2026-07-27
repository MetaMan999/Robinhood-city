import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Living Economy RPG",
  description:
    "Work, drive, own functional city assets, trade a live portfolio, join cooperatives, and build a persistent economic life in RHOOS CITY.",
  openGraph: {
    title: "RHOOS CITY — Own. Trade. Cooperate. Build.",
    description:
      "A living-city RPG with codified functional assets, a player marketplace, cooperative earnings, jobs, businesses, property, traffic, and driveable cars.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY player, functional asset cards, cooperative market, businesses, and cars",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — Own. Trade. Cooperate. Build.",
    description:
      "Work, drive, own functional city assets, trade a live portfolio, and build value with other players.",
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
