import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semester Notes Hub | Your Semester, Organized",
  description:
    "Organized academic repository for NLP, DA, DAA, DEVOPS, and CN. Download PDF notes, classroom whiteboard photos, and previous year question papers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-white text-slate-900 antialiased flex flex-col selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
