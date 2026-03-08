import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

const polySans = localFont({
  src: [
    { path: "../../public/fonts/PolySans-Neutral.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/PolySans-NeutralItalic.woff2", weight: "400", style: "italic" },
    { path: "../../public/fonts/PolySans-Median.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/PolySans-MedianItalic.woff2", weight: "500", style: "italic" },
    { path: "../../public/fonts/PolySans-Bulky.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/PolySans-BulkyItalic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-poly-sans",
  display: "swap",
  preload: true,
});

const pixelHackers = localFont({
  src: [{ path: "../../public/fonts/PixelHackers.woff2", weight: "400", style: "normal" }],
  variable: "--font-pixel-hackers",
  display: "swap",
  preload: true,
});

// oxlint-disable-next-line @factory/constants-file-organization -- Next.js convention
export const metadata: Metadata = {
  title: {
    default: "Ask Purdue Hackers",
    template: "%s | Ask Purdue Hackers",
  },
  description: "Ask questions about Purdue Hackers and get answers from our Notion workspace.",
};

// oxlint-disable-next-line @factory/constants-file-organization -- Next.js convention
export const viewport: Viewport = {
  themeColor: "#000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${polySans.variable} ${pixelHackers.variable}`}
      style={{ background: "#000" }}
    >
      <body className="antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <main id="main">{children}</main>
        <Toaster
          theme="dark"
          toastOptions={{
            style: { background: "#111", border: "1px solid #333", color: "#ededed" },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
