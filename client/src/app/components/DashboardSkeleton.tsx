import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Database, Activity, BarChart3 } from "lucide-react";

const STEPS = [
  { icon: Wifi,     text: "Connecting to live intelligence feeds…" },
  { icon: Database, text: "Querying GDELT and ReliefWeb…" },
  { icon: Activity, text: "Running ML risk-scoring pipeline…" },
  { icon: BarChart3,text: "Building breakdown and trend analysis…" },
];

function Bone({ w, h = "h-4", delay = 0 }: { w: string; h?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      className={`${h} ${w} bg-border/60 rounded-md animate-pulse`}
    />
  );
}

export function DashboardSkeleton() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % STEPS.length), 2200);
    return () => clearInterval(id);
  }, []);

  const { icon: Icon, text } = STEPS[step];

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 space-y-4">

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border border-border rounded-xl px-4 py-3 flex items-center gap-3 bg-card"
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            {text}
          </motion.div>
        </AnimatePresence>
        <div className="ml-auto h-0.5 w-24 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full bg-primary/50 rounded-full"
            animate={{ width: ["0%", "90%"] }}
            transition={{ duration: 9, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      {/* Hero card skeleton */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="border border-border rounded-xl bg-card overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Score */}
          <div className="flex flex-col items-center justify-center py-8 px-6 gap-5">
            <div className="w-36 h-36 rounded-full border-[10px] border-border animate-pulse" />
            <div className="w-24 h-6 bg-border/60 rounded-full animate-pulse" />
          </div>
          {/* Bars */}
          <div className="py-8 px-6 flex flex-col justify-center gap-3">
            <Bone w="w-28" h="h-3" delay={0.1} />
            {["w-full", "w-5/6", "w-4/5", "w-11/12", "w-3/4"].map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 h-3 bg-border/60 rounded animate-pulse" />
                <div className={`flex-1 h-1.5 ${w} bg-border/60 rounded-full animate-pulse`} />
              </div>
            ))}
          </div>
          {/* Factors */}
          <div className="py-8 px-6 flex flex-col justify-center gap-3">
            <Bone w="w-28" h="h-3" delay={0.1} />
            {["w-4/5","w-full","w-3/4","w-5/6","w-2/3"].map((w, i) => (
              <div key={i} className={`h-6 bg-border/60 rounded-lg animate-pulse ${w}`} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
            className="border border-border rounded-xl px-5 py-4 bg-card flex flex-col gap-2"
          >
            <div className="h-6 w-12 bg-border/60 rounded animate-pulse" />
            <div className="h-3 w-20 bg-border/60 rounded-full animate-pulse" />
          </motion.div>
        ))}
      </div>

      {/* Incident cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.08 }}
            className="border border-border rounded-xl p-4 bg-card flex flex-col gap-3 min-h-[140px]"
          >
            <div className="flex justify-between">
              <div className="h-5 w-16 bg-border/60 rounded-full animate-pulse" />
              <div className="h-4 w-14 bg-border/60 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-border/60 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-border/60 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-border/60 rounded animate-pulse mt-auto" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
