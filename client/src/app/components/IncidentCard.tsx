import React from "react";
import { Clock, ExternalLink, Radio } from "lucide-react";
import { type Incident } from "@shared/schema";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<string, string> = {
  high:     "bg-red-500/10    text-red-400    border-red-500/20",
  extreme:  "bg-red-500/10    text-red-400    border-red-500/20",
  medium:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  moderate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const CATEGORY_DOT: Record<string, string> = {
  Military:     "bg-red-400",
  Humanitarian: "bg-amber-400",
  Intelligence: "bg-violet-400",
  News:         "bg-blue-400",
  General:      "bg-slate-400",
};

export function IncidentCard({ incident }: { incident: Incident }) {
  const sevStyle = SEVERITY_STYLE[incident.severity ?? "low"] ?? SEVERITY_STYLE.low;
  const dot      = CATEGORY_DOT[incident.category ?? "General"] ?? CATEGORY_DOT.General;
  const hasLink  = !!incident.url;

  const Inner = (
    <div className={cn(
      "border border-border rounded-xl p-4 bg-card flex flex-col gap-3 h-full",
      hasLink && "hover:border-border/80 transition-colors",
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", sevStyle)}>
          {incident.severity}
        </span>
        {incident.is_realtime && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <Radio className="w-3 h-3 animate-pulse" /> Live
          </span>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
          <Clock className="w-3 h-3" />
          {incident.date}
        </div>
      </div>

      {/* Category */}
      {incident.category && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
          {incident.category}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
        {incident.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-grow">
        {incident.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
        <span className="text-xs text-muted-foreground/60">{incident.source}</span>
        {hasLink && <ExternalLink className="w-3 h-3 text-muted-foreground/40" />}
      </div>
    </div>
  );

  if (hasLink) {
    return (
      <a href={incident.url} target="_blank" rel="noopener noreferrer" className="block h-full">
        {Inner}
      </a>
    );
  }
  return Inner;
}
