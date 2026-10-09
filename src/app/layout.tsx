import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { FeedbackProvider } from "@/components/ui/feedback-provider";
import { themeBootScript } from "@/lib/theme/presets";

export const metadata: Metadata = {
  title: "Cikarang Dryport Event Management",
  description: "Event operations workspace for Cikarang Dryport.",
  icons: {
    icon: "/icon.svg",
  },
};

/**
 * Runs before first paint so a saved theme or density never flashes the
 * defaults. Built from the preset list, so an unknown stored value falls back
 * to the operating system's light/dark preference. The plain "light" / "dark"
 * values the old switcher saved are still valid preset ids.
 */
const preferenceScript = themeBootScript();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" data-density="compact" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body><FeedbackProvider>{children}</FeedbackProvider></body>
    </html>
  );
}
