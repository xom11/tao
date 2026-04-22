import { Github, BookOpen } from "lucide-react";

export function HeroSection() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tao Monitor</h1>
      <p className="text-muted-foreground text-sm md:text-base max-w-xl">
        Real-time Bittensor network monitoring. Tracks all subnets, neurons, emissions, and alpha prices.
        Data collected automatically every tempo (~72 minutes).
      </p>
      <div className="flex items-center gap-3 pt-1">
        <a
          href="https://github.com/xom11/tao"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span>GitHub</span>
        </a>
        <span className="text-muted-foreground/40">|</span>
        <a
          href="/api/docs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          <span>API Docs</span>
        </a>
      </div>
    </div>
  );
}
