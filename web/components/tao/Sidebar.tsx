"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subnets", label: "All Subnets" },
  { href: "/balances", label: "Balances" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 flex-1">
      {navLinks.map((l) => {
        const active = pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-muted"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const pathname = usePathname();

  return (
    <>
      {/* ── Mobile: top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-12 border-b bg-background/95 backdrop-blur-sm flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted"
          aria-label="Open menu"
        >
          <div className="flex flex-col gap-[5px]">
            <span className="block h-0.5 w-5 bg-foreground rounded-full" />
            <span className="block h-0.5 w-5 bg-foreground rounded-full" />
            <span className="block h-0.5 w-5 bg-foreground rounded-full" />
          </div>
        </button>
        <span className="font-semibold flex-1">⚡ Tao Monitor</span>
        <ThemeToggle />
      </header>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col p-4 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold text-lg">⚡ Tao Monitor</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        <div className="mt-auto pt-4 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Desktop: sidebar ── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r bg-muted/30 transition-[width] duration-200 overflow-hidden ${
          desktopOpen ? "w-52" : "w-0"
        }`}
      >
        <div className="w-52 p-4 flex flex-col h-full">
          <p className="font-semibold text-lg mb-4">⚡ Tao Monitor</p>
          <NavLinks pathname={pathname} />
          <div className="mt-auto pt-4 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ── Desktop: collapse toggle (fixed, slides with sidebar) ── */}
      <button
        onClick={() => setDesktopOpen(!desktopOpen)}
        className={`hidden md:flex fixed top-20 z-30 items-center justify-center h-8 w-4 rounded-r-md border-y border-r bg-muted hover:bg-accent text-xs text-muted-foreground transition-[left] duration-200 ${
          desktopOpen ? "left-52" : "left-0"
        }`}
        aria-label={desktopOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {desktopOpen ? "‹" : "›"}
      </button>
    </>
  );
}
