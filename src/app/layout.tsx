import type { Metadata } from "next";
import localFont from "next/font/local";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Service Delivery Intelligence",
  description: "Automated quarterly service delivery reviews for SELISE Digital Platforms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", openSans.variable)}>
      <body
        className={`${openSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
