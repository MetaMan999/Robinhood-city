import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rhoos-city-district-one.meta5555.chatgpt.site"),
  title: "RHOOS CITY — Work. Own. Lead.",
  description:
    "Clock in, perform useful work, own productive assets, build cooperatives, rise through civic reputation, and become mayor of RHOOS CITY.",
  openGraph: {
    title: "RHOOS CITY — Clock In. Build Value. Become Mayor.",
    description:
      "A living-city broker RPG where work creates output, asset trades fund a transparent reserve ledger, and high-reputation players can govern the city.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "RHOOS CITY broker clocks in, builds productive assets, and rises toward city leadership",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RHOOS CITY — Clock In. Build Value. Become Mayor.",
    description:
      "Work, own productive assets, build cooperatives, generate transparent city fees, and earn the reputation to become mayor.",
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
