"use client";

import { Github } from "lucide-react";

export function Nav() {
  return (
    <nav className="border-b">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-12">
        <span className="font-semibold text-sm">pol_measures</span>
        <a
          href="https://github.com/Ulvenforst/pol_measures"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </nav>
  );
}
