import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — NFT Work TCG",
  description:
    "Drive a street coupe through a living New York-style city, equip an NFT character, build a unique card deck, work corporate jobs, and rise to boss.",
  openGraph: {
    title: "RHOOS CITY — NFT Work TCG",
    description:
      "A fluid driving and first-person living-city TCG with unique cards, NFT characters, corporate careers, playable work, and HookTech.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY NFT Work TCG in a neon New York-style city",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — NFT Work TCG",
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
