import React from "react";
import "./global.css";

export const metadata = {
  title: "AI Business Launchpad",
  description: "Generate and edit your professional website using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
