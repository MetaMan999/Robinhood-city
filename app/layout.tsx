import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Third-Person Work RPG",
  description:
    "Choose a neighborhood spawn, walk a living city, find street jobs, repair cars, earn wages, drive multiple vehicles, and build a v4 Hook player identity.",
  openGraph: {
    title: "RHOOS CITY — Spawn. Walk. Work. Drive.",
    description:
      "A street-level living-city RPG with neighborhood spawns, walk-up jobs, mechanic work, traffic networks, v4 Hook player cards, and driveable cars.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY third-person character, city cars, conversations, and minimap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — Spawn. Walk. Work. Drive.",
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
