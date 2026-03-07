import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { Suspense } from "react";
import { GlobalOrderModal } from "@/components/dashboard/global-order-modal";
import { GlobalUbModal } from '@/components/dashboard/global-ub-modal';
import { GlobalQcModal } from '@/components/dashboard/global-qc-modal';

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Order Tracking Dashboard",
  description: "Real-time order tracking and logistics management dashboard. Track orders, manage loading points, and monitor dispatch status.",
  keywords: ["Order Tracking", "Logistics", "Dashboard", "Supply Chain", "Management"],
  authors: [{ name: "Order Tracking Team" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Suspense fallback={null}>
            <GlobalOrderModal />
            <GlobalUbModal />
            <GlobalQcModal />
          </Suspense>
        </AuthProvider>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
