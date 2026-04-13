import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/tao/ThemeProvider";
import { Sidebar } from "@/components/tao/Sidebar";
import { CommandPalette } from "@/components/tao/CommandPalette";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tao Monitor",
  description: "Bittensor network monitor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto min-w-0">
              <div className="p-4 md:p-6 pt-16 md:pt-6">
                {children}
              </div>
            </main>
          </div>
          <CommandPalette />
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
