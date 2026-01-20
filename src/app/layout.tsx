import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { SettingsProvider } from "@/context/settings-context";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Incidencias Administrativas",
  description: "Sistema de Gestión de Incidencias Administrativas para el Centro Universitario UNE A. C.",
  applicationName: "Incidencias Admin",
  appleWebApp: {
    capable: true,
    title: "Incidencias Admin",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    apple: [
      { url: '/assets/images/icons/icon-72x72.png', sizes: '72x72' },
      { url: '/assets/images/icons/icon-96x96.png', sizes: '96x96' },
      { url: '/assets/images/icons/icon-128x128.png', sizes: '128x128' },
      { url: '/assets/images/icons/icon-144x144.png', sizes: '144x144' },
      { url: '/assets/images/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/assets/images/icons/icon-192x192.png', sizes: '192x192' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0F1F6D',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}


export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <head />
      <body className={cn("font-body antialiased")}>
        <SettingsProvider>
          {children}
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}
