import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Player & Career Engine",
  description:
    "Create a character, choose a career, work skill-based city jobs, own businesses, and program the economy with HookTech.",
  openGraph: {
    title: "RHOOS CITY — Build a Life. Build the City.",
    description:
      "A first-person economic RPG with character customization, careers, playable work, businesses, and HookTech.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY player and career engine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — Build a Life. Build the City.",
    description:
      "Create a character, choose a profession, work city jobs, and build an economic life.",
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
