import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Lora, Quicksand } from "next/font/google";
import { ThemeProvider } from "next-themes";
import AttendlyShell from "@/components/attendly-shell";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Attendly | Class Attendance Monitoring",
  description:
    "Attendly is a class attendance monitoring system for managing students, recording attendance, and reviewing reports.",
};

// Preserve the starter font variable for compatibility.
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

// Headings
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

// Body text, buttons, forms, and navigation
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${lora.variable} ${quicksand.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense
            fallback={
              <main className="flex min-h-screen items-center justify-center bg-[#F6F8FC] px-4">
                <p className="text-sm font-semibold text-[#2448A5]">
                  Loading Attendly...
                </p>
              </main>
            }
          >
            <AttendlyShell>{children}</AttendlyShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
