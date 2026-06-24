import React from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "SiteMint — From idea to website in minutes.",
  description: "Generate, edit, and publish your professional website in minutes using conversational AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} scroll-smooth`}>
      <body className="font-sans bg-brand-bg text-brand-text min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
