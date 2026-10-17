import type { Metadata } from "next";
import { Lora, Outfit } from "next/font/google";

import CartDrawer from "@/components/CartDrawer";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { site, absoluteUrl } from "@/lib/site";

import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "ladies fashion Kenya",
    "Nairobi clothing store",
    "African women fashion",
    "dresses Nairobi",
    "online boutique Kenya",
    "M-Pesa clothing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    url: absoluteUrl("/"),
    locale: site.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-KE">
      <body className={`${lora.variable} ${outfit.variable} antialiased`}>
        {/*
          First focusable element on the page. The header is 50 lines of nav on
          every route; without this, a keyboard shopper tabs through all of it
          to reach the dress they came for.

          The target is a wrapper rather than each page's <main>, because every
          route owns its own <main> and this is the only element layout.tsx can
          put an id on without reaching into them.
        */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
        <CartDrawer />
      </body>
    </html>
  );
}