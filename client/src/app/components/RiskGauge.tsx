import React from "react";
import { motion } from "framer-motion";
import { getRiskColor, getRiskColorClass } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  level: string;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getRiskColor(score);
  const colorClass = getRiskColorClass(score, 'text');

  return (
    <div className="relative flex flex-col items-center justify-center p-6 glass-panel rounded-3xl">
      <h3 className="text-sm font-medium text-muted-foreground mb-6 self-start w-full uppercase tracking-wider">Overall Risk Score</h3>
      
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-white/5"
          />
          {/* Animated Foreground Circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            className="gauge-path transition-all duration-1000 ease-out"
            style={{ 
              "--target-offset": offset,
              strokeDasharray: circumference,
              strokeDashoffset: circumference // Start completely empty
            } as React.CSSProperties}
            filter="drop-shadow(0 0 8px rgba(0,0,0,0.5))"
          />
        </svg>

        {/* Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className={`text-5xl font-display font-bold ${colorClass} text-glow`}
            style={{ textShadow: `0 0 30px ${color}80` }}
          >
            {score}
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-muted-foreground mt-1"
          >
            / 100
          </motion.span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className={`mt-6 px-6 py-2 rounded-full font-bold tracking-wide uppercase text-sm border bg-opacity-10`}
        style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}15` }}
      >
        {level}
      </motion.div>
    </div>
  );
}
