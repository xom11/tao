"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import type { SubnetOverview } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Search & go to subnet" },
  { keys: ["?"], description: "Show all shortcuts" },
  { keys: ["G", "D"], description: "Go to Home" },
  { keys: ["G", "S"], description: "Go to All Subnets" },
  { keys: ["G", "B"], description: "Go to Balances" },
  { keys: ["G", "O"], description: "Go to Docs" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [showHelp, setShowHelp] = React.useState(false);
  const [subnets, setSubnets] = React.useState<SubnetOverview[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const router = useRouter();
  const listRef = React.useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K, ?, G+key shortcuts
  React.useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowHelp(false);
        setOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowHelp(true);
        setQuery("");
        setOpen(true);
        return;
      }

      if (e.key === "g" || e.key === "G") {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 500);
        return;
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        const routes: Record<string, string> = {
          d: "/",
          s: "/subnets",
          b: "/balances",
          o: "/docs",
        };
        const route = routes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(gTimer);
    };
  }, [router]);

  // Fetch subnets when opened
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setShowHelp(false);
      return;
    }
    if (showHelp) return;
    fetch(`${API}/api/subnets`)
      .then((r) => r.json())
      .then((data: SubnetOverview[]) => setSubnets(data))
      .catch(() => {});
  }, [open, showHelp]);

  // Filter subnets by ID, name, or symbol
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subnets;
    return subnets.filter(
      (s) =>
        String(s.netuid).includes(q) ||
        (s.subnet_name && s.subnet_name.toLowerCase().includes(q)) ||
        (s.symbol && s.symbol.toLowerCase().includes(q))
    );
  }, [query, subnets]);

  // If user typed a number that doesn't match any existing subnet, offer direct navigation
  const directId = React.useMemo(() => {
    const q = query.trim();
    if (!/^\d+$/.test(q)) return null;
    const id = parseInt(q, 10);
    // Only show direct option if no exact netuid match in filtered results
    if (filtered.some((s) => s.netuid === id)) return null;
    return id;
  }, [query, filtered]);

  const totalItems = filtered.length + (directId != null ? 1 : 0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-command-item]");
    const active = items[activeIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function navigate(netuid: number) {
    setOpen(false);
    router.push(`/subnets/${netuid}`);
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // Direct ID option is at the end
      if (directId != null && activeIndex === filtered.length) {
        navigate(directId);
      } else if (filtered[activeIndex]) {
        navigate(filtered[activeIndex].netuid);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideClose className="p-0 gap-0 max-w-md top-[30%] translate-y-[-30%]">
        {showHelp ? (
          <div className="p-4">
            <p className="text-sm font-medium mb-3">Keyboard shortcuts</p>
            <div className="space-y-2">
              {SHORTCUTS.map((s) => (
                <div key={s.description} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.description}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <React.Fragment key={k}>
                        {i > 0 && <span className="text-xs text-muted-foreground">then</span>}
                        <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Press <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[10px] font-medium">ESC</kbd> to close
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search subnet by name or ID..."
                className="flex-1 bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="max-h-72 overflow-y-auto p-1">
              {totalItems === 0 && subnets.length > 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No subnets found
                </p>
              )}
              {totalItems === 0 && subnets.length === 0 && query.trim() === "" && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Loading subnets...
                  <span className="block mt-1 text-xs">
                    Press <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[10px] font-medium mx-0.5">?</kbd> for all shortcuts
                  </span>
                </div>
              )}
              {filtered.map((s, i) => (
                <button
                  key={s.netuid}
                  data-command-item
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
              {directId != null && (
                <button
                  data-command-item
                  onClick={() => navigate(directId)}
                  onMouseEnter={() => setActiveIndex(filtered.length)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                    activeIndex === filtered.length
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="font-mono text-muted-foreground w-8 text-right shrink-0">
                    {directId}
                  </span>
                  <span className="truncate">Go to Subnet {directId}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
