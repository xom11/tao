import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tao Monitor",
  description: "Bittensor network monitor",
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-subnets", label: "My Subnets" },
  { href: "/subnets", label: "All Subnets" },
  { href: "/balances", label: "Balances" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <div className="flex min-h-screen">
          <nav className="w-52 shrink-0 border-r bg-muted/30 flex flex-col gap-1 p-4">
            <p className="font-semibold text-lg mb-4">⚡ Tao Monitor</p>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
