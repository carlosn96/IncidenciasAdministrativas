import type { Metadata } from "next";
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
};

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
