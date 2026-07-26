import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — NFT Work TCG",
  description:
    "Equip an NFT character or free city origin, build a unique live card deck, work New York-style corporate jobs, rise to boss, and program the economy.",
  openGraph: {
    title: "RHOOS CITY — NFT Work TCG",
    description:
      "A first-person living-city TCG with unique cards, verified NFT characters, corporate careers, playable work, and HookTech.",
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
      "Build a live work deck, rise from intern to boss, and build an economic life.",
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
