import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartPIM — AI-Powered WooCommerce Product Information Manager",
  description:
    "Transform incomplete product information into validated, WooCommerce-ready product data with AI-powered analysis, generation, and validation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-slate-50 font-sans antialiased">
        <div className="flex h-full">
          <Sidebar />
          <div className="flex-1 ml-60 flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
