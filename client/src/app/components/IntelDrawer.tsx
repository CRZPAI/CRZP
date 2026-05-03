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
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-white/[0.08] overflow-hidden"
            style={{
              background: "rgba(5, 9, 20, 0.97)",
              backdropFilter: "blur(24px)",
              maxHeight: "82vh",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTab("watchlist")}
                  className="relative flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-colors duration-200 rounded-lg"
                  style={{
                    color: tab === "watchlist" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    background: tab === "watchlist" ? "rgba(245,158,11,0.08)" : "transparent",
                  }}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Live Monitor
                  {tab === "watchlist" && (
                    <motion.div
                      layoutId="drawer-tab-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-500 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
                <button
                  onClick={() => setTab("leaderboard")}
                  className="relative flex items-center gap-2 px-4 py-2 text-[12px] font-semibold transition-colors duration-200 rounded-lg"
                  style={{
                    color: tab === "leaderboard" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    background: tab === "leaderboard" ? "rgba(245,158,11,0.08)" : "transparent",
                  }}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  Risk Leaderboard
                  {tab === "leaderboard" && (
                    <motion.div
                      layoutId="drawer-tab-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-500 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-white/40 hover:text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(82vh - 90px)" }}>
              <AnimatePresence mode="wait">
                {tab === "watchlist" ? (
                  <motion.div
                    key="watchlist"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WatchlistPanel onSelectLocation={(loc) => { onSelectLocation(loc); onClose(); }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="leaderboard"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RiskLeaderboard onSelectLocation={(loc) => { onSelectLocation(loc); onClose(); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
