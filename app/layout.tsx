import "@/styles/globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Uyumsoft Exporter",
  description: "Sync Uyumsoft CSV exports into Google Sheets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">
        <Providers>
          <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-12 sm:px-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
