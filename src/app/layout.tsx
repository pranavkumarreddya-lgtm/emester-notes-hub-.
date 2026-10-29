import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semester Notes Hub | 3-Friend Collaborative Study Vault",
  description: "Collaborative semester study repository for NLP, DA, DAA, DEVOPS, and CN.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
