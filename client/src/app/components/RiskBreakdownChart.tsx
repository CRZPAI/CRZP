import React from "react";
import { motion } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { type RiskBreakdown } from "@shared/schema";

interface Props { breakdown: RiskBreakdown }

const LABELS: Record<keyof RiskBreakdown, string> = {
  military:     "Military",
  political:    "Political",
  economic:     "Economic",
  social:       "Social",
  humanitarian: "Humanitarian",
};

function barColor(score: number) {
  if (score < 30) return "#22c55e";
  if (score < 55) return "#f59e0b";
  if (score < 75) return "#f97316";
  return "#ef4444";
}

function DimBar({ label, value }: { label: string; value: number }) {
  const color = barColor(value);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        />
      </div>
      <span className="text-xs font-semibold w-7 text-right tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="font-medium text-foreground mb-0.5">{payload[0].payload.subject}</p>
        <p className="text-muted-foreground">{payload[0].value} / 100</p>
      </div>
    );
  }
  return null;
};

export function RiskBreakdownChart({ breakdown }: Props) {
  const data = (Object.keys(LABELS) as (keyof RiskBreakdown)[]).map(k => ({
    subject: LABELS[k],
    value:   breakdown[k],
    fullMark: 100,
  }));

  const highest = data.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Risk Breakdown</h3>
        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full font-medium">
          Highest: {highest.subject}
        </span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="hsl(217 19% 18%)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "hsl(215 16% 55%)", fontSize: 11, fontWeight: 500 }}
            />
            <Radar
              name="Risk"
              dataKey="value"
              stroke="hsl(213 94% 68%)"
              fill="hsl(213 94% 68%)"
              fillOpacity={0.12}
              strokeWidth={1.5}
              dot={{ fill: "hsl(213 94% 68%)", r: 2.5 }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3">
        {(Object.keys(LABELS) as (keyof RiskBreakdown)[]).map(k => (
          <DimBar key={k} label={LABELS[k]} value={breakdown[k]} />
        ))}
      </div>
    </div>
  );
}
