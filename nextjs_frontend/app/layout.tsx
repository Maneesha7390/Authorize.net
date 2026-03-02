import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Authorize.net Payment Portal",
  description: "Secure payment processing powered by Authorize.net",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        {/* Authorize.net Accept.js — required for tokenizing card data client-side */}
        <Script
          src="https://jstest.authorize.net/v1/Accept.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
