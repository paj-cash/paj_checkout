import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { connection } from "next/server";
import "./globals.css";

// PAJ's brand faces, the same files paj_webapp and paj_business_hub ship.
const helvetica = localFont({
  variable: "--font-helvetica",
  display: "swap",
  src: [
    { path: "./fonts/HelveticaNeueRoman.otf", weight: "400", style: "normal" },
    { path: "./fonts/HelveticaNeueMedium.otf", weight: "500", style: "normal" },
    { path: "./fonts/HelveticaNeueBold.otf", weight: "700", style: "normal" },
  ],
});

const neighbor = localFont({
  variable: "--font-neighbor",
  display: "swap",
  src: [
    { path: "./fonts/Neighbor-Semibold.otf", weight: "600", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: { default: "PAJ Checkout", template: "%s · PAJ Checkout" },
  description: "Pay securely with PAJ.",
  // A checkout is one person's payment, never something to index.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f7",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Every page renders per request: the CSP nonce from proxy.ts can only be
  // put on scripts at request time, and a prerendered page would have none.
  await connection();

  return (
    <html
      lang="en"
      className={`${helvetica.variable} ${neighbor.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
