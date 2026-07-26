import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Third-Person Work RPG",
  description:
    "Explore a living city with easy third-person controls, enter multiple cars, talk to scheduled citizens, follow a live minimap, work corporate jobs, and rise to boss.",
  openGraph: {
    title: "RHOOS CITY — Move. Talk. Drive. Work.",
    description:
      "A third-person living-city RPG with easy car entry, city conversations, a live minimap, unique cards, corporate careers, and playable work.",
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
    title: "RHOOS CITY — Move. Talk. Drive. Work.",
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
