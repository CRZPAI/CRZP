import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, TrendingDown, TrendingUp, Minus, Newspaper } from "lucide-react";
import { type NewsArticle, type NewsStats } from "@shared/schema";
import { cn } from "@/lib/utils";

interface Props {
  articles: NewsArticle[];
  stats?: NewsStats;
  location: string;
}

const SENTIMENT: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  negative: { icon: TrendingDown, color: "text-red-400",    bg: "bg-red-500/10    border-red-500/20",    label: "Negative" },
  positive: { icon: TrendingUp,   color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20",label: "Positive" },
  neutral:  { icon: Minus,        color: "text-blue-400",   bg: "bg-blue-500/10   border-blue-500/20",   label: "Neutral"  },
};

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const cfg  = SENTIMENT[sentiment] ?? SENTIMENT.neutral;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium", cfg.color, cfg.bg)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function StatsBar({ stats }: { stats: NewsStats }) {
  const total  = stats.total || 1;
  const negPct = Math.round((stats.negative / total) * 100);
  const posPct = Math.round((stats.positive / total) * 100);
  return (
    <div className="border border-border rounded-lg p-3 flex flex-col gap-2 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground">Sentiment Distribution — {stats.total} articles</p>
      <div className="flex rounded-full overflow-hidden h-1.5">
        <div className="bg-red-500 transition-all duration-700" style={{ width: `${negPct}%` }} />
        <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${posPct}%` }} />
        <div className="bg-blue-500 transition-all duration-700 flex-1" />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span><span className="text-red-400 font-semibold">{stats.negative}</span> negative ({negPct}%)</span>
        <span><span className="text-emerald-400 font-semibold">{stats.positive}</span> positive ({posPct}%)</span>
        <span><span className="text-blue-400 font-semibold">{stats.neutral}</span> neutral</span>
      </div>
    </div>
  );
}

function ArticleRow({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <motion.a
      href={article.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="group flex items-start gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/20 -mx-1 px-1 rounded transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <SentimentBadge sentiment={article.sentiment} />
          <span className="text-xs text-muted-foreground">{article.source}</span>
          <span className="text-xs text-muted-foreground/50">{article.date}</span>
          {article.is_realtime && (
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          )}
        </div>
      </div>
      {article.url && (
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary flex-shrink-0 mt-0.5 transition-colors" />
      )}
    </motion.a>
  );
}

export function LiveNewsFeed({ articles, stats, location }: Props) {
  if (!articles || articles.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center">
        <Newspaper className="w-8 h-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No recent news found for {location}.</p>
        <p className="text-xs text-muted-foreground/50 mt-1">Try a more prominent city name.</p>
      </div>
    );
  }

  const realtime = articles.filter(a => a.is_realtime);
  const past     = articles.filter(a => !a.is_realtime);

  return (
    <div className="flex flex-col gap-5">
      {stats && <StatsBar stats={stats} />}

      {realtime.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live — Last 24h</p>
          </div>
          <div>
            {realtime.map((a, i) => <ArticleRow key={i} article={a} index={i} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Past 48h</p>
          <div>
            {past.map((a, i) => <ArticleRow key={i} article={a} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
