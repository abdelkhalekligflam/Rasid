import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastViewport } from "@/components/shared/toast";
import { getLocale } from "@/lib/i18n-server";
import { LocaleProvider } from "@/components/locale-provider";
import { QueryProvider } from "@/components/query-provider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Rasid",
  icons: { icon: "/rasid-icon.svg", shortcut: "/rasid-icon.svg" },
  description: "Track budgets, transactions and savings goals with clarity",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale()
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <LocaleProvider locale={locale}><TooltipProvider>{children}<ToastViewport /></TooltipProvider></LocaleProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
