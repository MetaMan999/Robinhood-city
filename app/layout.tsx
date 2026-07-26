import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — First Person HookTech",
  description:
    "Enter a living first-person programmable city powered by HookTech.",
  openGraph: {
    title: "RHOOS CITY",
    description: "A living first-person programmable city powered by HookTech.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY — First Person HookTech",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY",
    description: "A living first-person programmable city powered by HookTech.",
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
