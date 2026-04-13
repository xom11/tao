"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import type { SubnetOverview } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [subnets, setSubnets] = React.useState<SubnetOverview[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K to toggle
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch subnets when opened
  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    fetch(`${API}/api/subnets`)
      .then((r) => r.json())
      .then((data: SubnetOverview[]) => setSubnets(data))
      .catch(() => {});
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return subnets;
    const q = query.toLowerCase();
    return subnets.filter(
      (s) =>
        String(s.netuid).includes(q) ||
        (s.subnet_name && s.subnet_name.toLowerCase().includes(q)) ||
        (s.symbol && s.symbol.toLowerCase().includes(q))
    );
  }, [query, subnets]);

  // Reset active index when results change
  React.useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length]);

  // Scroll active item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function navigate(netuid: number) {
    setOpen(false);
    router.push(`/subnets/${netuid}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      e.preventDefault();
      navigate(filtered[activeIndex].netuid);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-md top-[30%] translate-y-[-30%]">
        {/* Search input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Go to subnet... (name or ID)"
            className="flex-1 bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {subnets.length === 0 ? "Loading..." : "No subnets found"}
            </p>
          )}
          {filtered.map((s, i) => (
            <button
              key={s.netuid}
              onClick={() => navigate(s.netuid)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              <span className="font-mono text-muted-foreground w-8 text-right shrink-0">
                {s.netuid}
              </span>
              <span className="truncate font-medium">
                {s.subnet_name ?? "Unknown"}
              </span>
              {s.symbol && (
                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                  {s.symbol}
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
