import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono, Syne } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { SiteHeader } from "@/components/SiteHeader";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Python Mastery · Concept Checks",
  description:
    "Mobile-friendly quizzes, debugging challenges, and coding tests for college Python courses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07131a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${code.variable} h-full antialiased`}
    >
      <body className="ambient min-h-full flex flex-col text-slate-100">
        <SessionProvider>
          <div className="pointer-events-none fixed inset-0 grid-overlay opacity-60" />
          <SiteHeader />
          <div className="relative z-10 flex flex-1 flex-col">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
