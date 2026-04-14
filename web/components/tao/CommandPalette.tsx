"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Go to subnet by ID" },
  { keys: ["?"], description: "Show all shortcuts" },
  { keys: ["G", "D"], description: "Go to Dashboard" },
  { keys: ["G", "S"], description: "Go to All Subnets" },
  { keys: ["G", "M"], description: "Go to My Subnets" },
  { keys: ["G", "B"], description: "Go to Balances" },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [showHelp, setShowHelp] = React.useState(false);
  const router = useRouter();

  // Cmd+K / Ctrl+K to open subnet search
  // ? to show shortcuts help
  // G+key for page navigation
  React.useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Ctrl+K always works
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowHelp(false);
        setOpen((prev) => !prev);
        return;
      }

      // Skip other shortcuts when in input fields
      if (isInput) return;

      // ? to show help
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp(true);
        setQuery("");
        setOpen(true);
        return;
      }

      // G + key combos for page navigation
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
          d: "/dashboard",
          s: "/subnets",
          m: "/my-subnets",
          b: "/balances",
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

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setShowHelp(false);
    }
  }, [open]);

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    const id = query.trim();
    if (!id) return;
    // If it's a number, go directly
    if (/^\d+$/.test(id)) {
      setOpen(false);
      router.push(`/subnets/${id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideClose className="p-0 gap-0 max-w-md top-[30%] translate-y-[-30%]">
        {showHelp ? (
          /* Shortcuts help view */
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
          /* Subnet search view */
          <form onSubmit={go}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Subnet ID (e.g. 118)"
                className="flex-1 bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
            {query.trim() && /^\d+$/.test(query.trim()) && (
              <div className="p-1">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm text-left bg-accent text-accent-foreground"
                >
                  <span className="font-mono text-muted-foreground">{query.trim()}</span>
                  <span>Go to Subnet {query.trim()}</span>
                </button>
              </div>
            )}
            {!query.trim() && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Type a subnet ID and press <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[10px] font-medium mx-0.5">Enter</kbd> to go
                <span className="block mt-1 text-xs">
                  Press <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[10px] font-medium mx-0.5">?</kbd> for all shortcuts
                </span>
              </div>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
