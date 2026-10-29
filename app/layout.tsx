import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import {
  LANG_COOKIE,
  LARGE_TEXT_COOKIE,
  normalizeLang,
} from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "Skipline Hub — Less Waiting. More Living.",
    template: "%s · Skipline Hub",
  },
  description:
    "Compare estimated waiting times, join smart queues, book service slots and receive turn alerts across hospitals, banks, diagnostic centres and government offices.",
  keywords: [
    "queue management",
    "waiting time prediction",
    "virtual queue",
    "appointment booking",
    "service centres",
    "Skipline Hub",
  ],
  authors: [{ name: "Skipline Hub" }],
  openGraph: {
    title: "Skipline Hub — Less Waiting. More Living.",
    description:
      "Smart queue management and waiting-time prediction for everyday services.",
    type: "website",
    siteName: "Skipline Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skipline Hub — Less Waiting. More Living.",
    description:
      "Smart queue management and waiting-time prediction for everyday services.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#F7F1E7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const lang = normalizeLang(jar.get(LANG_COOKIE)?.value);
  const largeText = jar.get(LARGE_TEXT_COOKIE)?.value === "1";

  return (
    <html lang={lang} className={largeText ? "large-text" : undefined} suppressHydrationWarning>
      <body>
        <div className="ambient" aria-hidden="true" />
        <div className="noise" aria-hidden="true" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to main content
        </a>
        <AppProviders initialLang={lang} initialLargeText={largeText}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
