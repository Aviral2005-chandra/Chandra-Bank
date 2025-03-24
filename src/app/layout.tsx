import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chandra Bank of India",
  description: "A secure banking solution by Chandra Bank of India",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <header className="gradient-bg text-white p-6 shadow-lg">
            <h1 className="text-3xl font-bold tracking-tight">Chandra Bank of India</h1>
          </header>
          <Nav />
          <main className="flex-grow zinc-bg">{children}</main>
          <footer className="bg-zinc-900 text-zinc-300 p-4 text-center">
            <p>© 2025 Chandra Bank of India. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}