import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ACCENT_COOKIE, THEME_COOKIE, normalizeTheme, resolveThemeForHtml } from "@/lib/theme";
import type { AccentId } from "@/lib/settings-preferences";
import { Providers } from "@/components/providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Habitat",
  description:
    "Simple habit tracking — log today, see your streaks and stats.",
  applicationName: "Habitat",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Habitat",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const themeMode = normalizeTheme(jar.get(THEME_COOKIE)?.value);
  const theme = resolveThemeForHtml(themeMode);
  const accentRaw = jar.get(ACCENT_COOKIE)?.value;
  const accent =
    accentRaw === "green" ||
    accentRaw === "purple" ||
    accentRaw === "blue" ||
    accentRaw === "orange" ||
    accentRaw === "pink" ||
    accentRaw === "teal"
      ? accentRaw
      : ("green" satisfies AccentId);

  return (
    <html
      lang="en"
      data-theme={theme}
      data-accent={accent}
      className={cn("h-full", geist.variable, geistMono.variable, "font-sans")}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        {/* Re-apply the stored theme before paint: the PWA precaches the
            offline shell, so its server-rendered data-theme can be stale. */}
        <Script
          id="dev-sw-cleanup"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "if(typeof window!=='undefined'&&location.hostname==='localhost'&&'serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister();});});}",
          }}
        />
        <Script
          id="theme-sync"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "try{var m=document.cookie.match(/(?:^|; )habitat-theme=(dark|light|system)/);var mode=m?m[1]:'dark';if(mode==='system'){var light=window.matchMedia('(prefers-color-scheme: light)').matches;document.documentElement.dataset.theme=light?'light':'dark';}else{document.documentElement.dataset.theme=mode;}var a=document.cookie.match(/(?:^|; )habitat-accent=(green|purple|blue|orange|pink|teal)/);if(a)document.documentElement.dataset.accent=a[1];}catch(e){}",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
