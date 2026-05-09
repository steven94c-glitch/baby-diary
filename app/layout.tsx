import type { Metadata } from "next";
import "./globals.css";

const babyName = process.env.BABY_NAME ?? "Baby";

export const metadata: Metadata = {
  title: `${babyName}'s Diary`,
  description: `A little corner of the internet for ${babyName}.`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-serif antialiased">{children}</body>
    </html>
  );
}
