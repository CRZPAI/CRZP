import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { type TrendPoint } from "@shared/schema";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props { trend: TrendPoint[]; currentScore: number }

function getRiskStroke(score: number) {
  if (score < 25) return "#22c55e";
  if (score < 50) return "#f59e0b";
  if (score < 75) return "#f97316";
  return "#ef4444";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const score = payload[0].value;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-lg font-bold" style={{ color: getRiskStroke(score) }}>{score}</p>
      </div>
    );
  }
  return null;
};

export function TrendChart({ trend, currentScore }: Props) {
  if (!trend || trend.length === 0) return null;

  const firstScore = trend[0]?.score ?? currentScore;
  const delta      = currentScore - firstScore;
  const stroke     = getRiskStroke(currentScore);

  const TrendIcon  = delta > 3 ? TrendingUp : delta < -3 ? TrendingDown : Minus;
  const trendColor = delta > 3 ? "#ef4444" : delta < -3 ? "#22c55e" : "#f59e0b";
  const trendLabel = delta > 3 ? "Escalating" : delta < -3 ? "De-escalating" : "Stable";

  return (
    <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">7-Day Risk Trend</h3>
        <span
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border"
          style={{ color: trendColor, borderColor: `${trendColor}30`, backgroundColor: `${trendColor}10` }}
        >
          <TrendIcon className="w-3 h-3" />
          {trendLabel}
        </span>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={stroke} stopOpacity={0.2} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(215 16% 55%)", fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "hsl(215 16% 55%)", fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <ReferenceLine y={75} stroke="rgba(239,68,68,0.12)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="score"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#riskGrad)"
              dot={{ fill: stroke, r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: stroke }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-3">
        <span>7 days ago: <span className="font-semibold text-foreground">{firstScore}</span></span>
        <span>Change: <span className="font-semibold" style={{ color: trendColor }}>{delta >= 0 ? "+" : ""}{delta} pts</span></span>
        <span>Today: <span className="font-semibold text-foreground">{currentScore}</span></span>
      </div>
    </div>
  );
}
