import { motion, AnimatePresence } from "framer-motion";
import { X, Radio, LayoutList } from "lucide-react";
import { WatchlistPanel } from "./WatchlistPanel";
import { RiskLeaderboard } from "./RiskLeaderboard";
import { useState, useEffect } from "react";

interface SelectionLoc {
  displayName: string;
  lat: number;
  lon: number;
}

interface Props {
  open: boolean;
  defaultTab?: "watchlist" | "leaderboard";
  onClose: () => void;
  onSelectLocation: (loc: SelectionLoc) => void;
}

export function IntelDrawer({ open, defaultTab = "watchlist", onClose, onSelectLocation }: Props) {
  const [tab, setTab] = useState<"watchlist" | "leaderboard">(defaultTab);

  useEffect(() => {
    if (open && defaultTab) setTab(defaultTab);
  }, [open, defaultTab]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[3px]"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
            style={{
              background: "rgba(4, 7, 18, 0.98)",
              borderTop: "1px solid rgba(245,158,11,0.12)",
              maxHeight: "80vh",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>

            {/* Header with tabs */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">

              {/* Tab buttons */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => setTab("watchlist")}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200"
                  style={{
                    color: tab === "watchlist" ? "#fff" : "rgba(255,255,255,0.35)",
                    background: tab === "watchlist" ? "rgba(245,158,11,0.14)" : "transparent",
                    boxShadow: tab === "watchlist" ? "inset 0 0 0 1px rgba(245,158,11,0.2)" : "none",
                  }}
                >
                  <Radio className="w-3.5 h-3.5" style={{ color: tab === "watchlist" ? "#f59e0b" : "currentColor" }} />
                  <span>Live Monitor</span>
                  {tab === "watchlist" && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setTab("leaderboard")}
                  className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200"
                  style={{
                    color: tab === "leaderboard" ? "#fff" : "rgba(255,255,255,0.35)",
                    background: tab === "leaderboard" ? "rgba(245,158,11,0.14)" : "transparent",
                    boxShadow: tab === "leaderboard" ? "inset 0 0 0 1px rgba(245,158,11,0.2)" : "none",
                  }}
                >
                  <LayoutList className="w-3.5 h-3.5" style={{ color: tab === "leaderboard" ? "#f59e0b" : "currentColor" }} />
                  <span>Risk Leaderboard</span>
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.08] transition-colors text-white/35 hover:text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content — only ONE panel mounts at a time */}
            <div className="overflow-y-auto custom-scrollbar px-5 py-5" style={{ maxHeight: "calc(80vh - 96px)" }}>
              {tab === "watchlist" && (
                <WatchlistPanel onSelectLocation={(loc) => { onSelectLocation(loc); onClose(); }} />
              )}
              {tab === "leaderboard" && (
                <RiskLeaderboard onSelectLocation={(loc) => { onSelectLocation(loc); onClose(); }} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
