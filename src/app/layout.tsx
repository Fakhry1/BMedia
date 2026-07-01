import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { LangProvider } from "@/lib/LangContext";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export const metadata: Metadata = {
  title: "BMedia — منصة المحتوى",
  description: "منصة متكاملة لإدارة المحتوى الرقمي",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload" as="style"
          href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Noto+Kufi+Arabic:wght@300;400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Noto+Kufi+Arabic:wght@300;400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="bmedia-preferences" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('bmedia-theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.setAttribute('data-theme','dark');}catch(e){}try{var l=localStorage.getItem('bmedia-lang');if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}}catch(e){}`}
        </Script>
        <LangProvider>
          {children}
          <MobileBottomNav />
        </LangProvider>
      </body>
    </html>
  );
}
