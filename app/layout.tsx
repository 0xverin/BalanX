import type { Metadata } from "next";
import { Orbitron, Exo_2, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const exo = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BalanX — CEX/DEX Balance Monitor",
  description:
    "Track the real-time USD value of your crypto across OKX DEX wallets and Binance. All data stays in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-screen">
        <div className="ambient" aria-hidden />
        {children}
      </body>
    </html>
  );
}
