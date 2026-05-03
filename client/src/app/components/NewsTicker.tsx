import React, { useRef, useEffect } from "react";
import { Radio } from "lucide-react";
import { type NewsArticle } from "@shared/schema";
import { cn } from "@/lib/utils";

interface Props { articles: NewsArticle[]; location: string }

export function NewsTicker({ articles, location }: Props) {
  if (!articles || articles.length === 0) return null;

  const items = articles.slice(0, 12);
  // duplicate for seamless loop
  const all = [...items, ...items];

  const SENT_COLOR: Record<string, string> = {
    negative: "text-red-400",
    positive: "text-emerald-400",
    neutral:  "text-blue-400",
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 border-t border-border backdrop-blur-md overflow-hidden h-9 flex items-center">
      <div className="flex items-center gap-2 px-3 flex-shrink-0 border-r border-border h-full">
        <Radio className="w-3 h-3 text-primary animate-pulse" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wider whitespace-nowrap">Live Intel</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex gap-12 whitespace-nowrap animate-[ticker_60s_linear_infinite]">
          {all.map((a, i) => (
            <a
              key={i}
              href={a.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className={cn("font-medium", SENT_COLOR[a.sentiment] ?? "text-muted-foreground")}>
                {a.sentiment === "negative" ? "▼" : a.sentiment === "positive" ? "▲" : "●"}
              </span>
              <span className="font-medium text-foreground/80">{a.source}</span>
              <span>{a.title}</span>
              <span className="text-muted-foreground/30">·</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
