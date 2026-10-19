import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import Reveal from "@/components/Reveal";
import { revealBootScript, revealCss } from "@/lib/reveal";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Industry-Ready QA & Software Testing Programme | Genix Solutions", template: "%s | Genix Solutions" },
  description: "Learn software testing through realistic project scenarios and the workflows used by professional QA teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
        <style dangerouslySetInnerHTML={{ __html: revealCss }} />
      </head>
      <body>
        <SmoothScroll />
        <Reveal />
        <a className="skip" href="#main">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
