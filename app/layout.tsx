import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Third-Person Work RPG",
  description:
    "Explore a living city with simple N64-inspired third-person controls, drive a street coupe, build a unique card deck, work corporate jobs, and rise to boss.",
  openGraph: {
    title: "RHOOS CITY — Move. Drive. Work. Collect.",
    description:
      "An accessible third-person living-city RPG with fluid driving, unique cards, NFT characters, corporate careers, and playable work.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY third-person character and driving game in a neon city",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — Move. Drive. Work. Collect.",
    description:
      "Drive the city, build a live work deck, rise from intern to boss, and build an economic life.",
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
