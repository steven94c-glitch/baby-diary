import type { Metadata } from "next";
import { Caveat, Lora } from "next/font/google";
import "./globals.css";

const babyName = process.env.BABY_NAME ?? "Baby";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${babyName}'s Diary`,
  description: `A little corner of the internet for ${babyName}.`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${lora.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
