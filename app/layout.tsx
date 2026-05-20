import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Response Evaluation Tool",
  description:
    "Compare two AI answers, score answer quality, capture reviewer notes, and export evaluation data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900">
        {children}
      </body>
    </html>
  );
}
