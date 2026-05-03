import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_STEPS = [
  { text: "INIT :: Establishing secure uplink...",         col: "rgba(255,255,255,0.3)" },
  { text: "GDELT :: Connecting to intelligence network...", col: "rgba(255,255,255,0.3)" },
  { text: "ReliefWeb :: Loading incident database...",     col: "rgba(255,255,255,0.3)" },
  { text: "ML_CORE :: Calibrating threat ensemble...",     col: "rgba(255,255,255,0.3)" },
  { text: "VECTOR :: Mapping global conflict zones...",    col: "rgba(255,255,255,0.3)" },
  { text: "GEO :: Indexing 195 sovereign territories...", col: "rgba(255,255,255,0.3)" },
  { text: "STATUS :: All systems nominal.",                col: "#f59e0b" },
  { text: "ACCESS GRANTED",                               col: "#22c55e" },
];

interface Props { onComplete: () => void; }

export function LoadingScreen({ onComplete }: Props) {
  const [step, setStep]               = useState(0);
  const [progress, setProgress]       = useState(0);
  const [done, setDone]               = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [logLines, setLogLines]       = useState<number[]>([0]);

  useEffect(() => {
    let p = 0;
    const duration = 3000;
    const interval = 22;
    const inc = 100 / (duration / interval);

    const tick = setInterval(() => {
      p = Math.min(p + inc, 100);
      setProgress(p);
      const s = Math.min(Math.floor((p / 100) * (BOOT_STEPS.length - 1)), BOOT_STEPS.length - 1);
      setStep(prev => {
        if (s > prev) setLogLines(l => [...l, s]);
        return s;
      });
    }, interval);

    const end = setTimeout(() => {
      clearInterval(tick);
      setProgress(100);
      setStep(BOOT_STEPS.length - 1);
      setAccessGranted(true);
      setTimeout(() => { setDone(true); setTimeout(onComplete, 650); }, 750);
    }, duration);

    return () => { clearInterval(tick); clearTimeout(end); };
  }, [onComplete]);

  const R = 90;
  const circ = 2 * Math.PI * R;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020810] overflow-hidden"
        >
          {/* Hex grid bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.025,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'%3E%3Cpolygon fill='none' stroke='%23f59e0b' stroke-width='0.8' points='28,2 54,14 54,38 28,46 2,38 2,14'/%3E%3C/svg%3E")`,
              backgroundSize: "56px 48px",
            }}
          />

          {/* Ambient radial glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)"
          }} />

          {/* Scanline sweep */}
          <motion.div
            className="absolute left-0 right-0 h-[1px] pointer-events-none z-20"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.2) 50%, transparent 100%)" }}
            animate={{ top: ["-1%", "101%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
          />

          {/* CRT scanlines overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)" }}
          />

          {/* ── Main content ── */}
          <div className="relative z-10 flex flex-col items-center">

            {/* Circular progress ring */}
            <div className="relative w-[240px] h-[240px] flex items-center justify-center mb-8">

              {/* Outer ring spinning */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              />

              {/* Dashed middle ring — counter-rotate */}
              <motion.svg
                className="absolute inset-0 w-full h-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                viewBox="0 0 240 240"
              >
                <circle cx="120" cy="120" r="105" fill="none"
                  stroke="rgba(245,158,11,0.1)" strokeWidth="1"
                  strokeDasharray="6 10" strokeLinecap="round" />
              </motion.svg>

              {/* SVG progress arc */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 240 240">
                {/* Track */}
                <circle cx="120" cy="120" r={R} fill="none"
                  stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                {/* Progress */}
                <circle cx="120" cy="120" r={R} fill="none"
                  stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={circ}
                  style={{
                    strokeDashoffset: circ * (1 - progress / 100),
                    transition: "stroke-dashoffset 0.12s linear",
                    filter: "drop-shadow(0 0 6px rgba(245,158,11,0.8))",
                  }}
                />
                {/* Dot at progress tip */}
                <motion.circle
                  cx="120" cy={120 - R}
                  r="3" fill="#f59e0b"
                  style={{ filter: "drop-shadow(0 0 4px #f59e0b)" }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              </svg>

              {/* Inner globe + percent */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <motion.svg
                  width="52" height="52" viewBox="0 0 72 72" fill="none"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <circle cx="36" cy="36" r="33" stroke="rgba(245,158,11,0.55)" strokeWidth="1.2" />
                  <ellipse cx="36" cy="36" rx="17" ry="33" stroke="rgba(245,158,11,0.28)" strokeWidth="0.9" />
                  <line x1="3" y1="36" x2="69" y2="36" stroke="rgba(245,158,11,0.2)" strokeWidth="0.7" />
                  <line x1="6" y1="22" x2="66" y2="22" stroke="rgba(245,158,11,0.12)" strokeWidth="0.5" />
                  <line x1="6" y1="50" x2="66" y2="50" stroke="rgba(245,158,11,0.12)" strokeWidth="0.5" />
                  <circle cx="36" cy="36" r="3" fill="#f59e0b" />
                  <motion.circle cx="36" cy="36" stroke="rgba(245,158,11,0.5)" strokeWidth="0.8" fill="none"
                    animate={{ r: [4, 18, 4], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.svg>

                <motion.span
                  className="text-[22px] font-black text-amber-400 tabular-nums leading-none tracking-tight"
                  animate={accessGranted ? { color: ["#f59e0b", "#22c55e"] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {Math.round(progress)}%
                </motion.span>
              </div>
            </div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-center mb-6"
            >
              <div className="flex items-center justify-center gap-2.5 mb-1">
                <span className="text-2xl font-black uppercase tracking-[0.28em] text-white leading-none">CRZP</span>
                <span className="text-2xl font-black uppercase tracking-[0.28em] text-amber-400 leading-none">APEX</span>
              </div>
              <p className="text-[8px] font-bold tracking-[0.45em] uppercase text-white/18">
                Geopolitical Intelligence Platform
              </p>
            </motion.div>

            {/* Terminal boot log */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-[440px] rounded-xl overflow-hidden mb-5"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Terminal chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-[9px] font-mono text-white/20 tracking-[0.3em] ml-1 uppercase">boot_sequence.log</span>
                <div className="flex-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </div>

              {/* Log lines */}
              <div className="p-4 space-y-1.5 min-h-[100px]">
                <AnimatePresence>
                  {BOOT_STEPS.slice(0, step + 1).map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2"
                    >
                      <span className="text-[10px] font-mono" style={{
                        color: i === step ? s.col : "rgba(255,255,255,0.14)"
                      }}>
                        {i === step ? "▸" : "·"}
                      </span>
                      <span className="text-[10px] font-mono leading-tight" style={{
                        color: i === step ? s.col : "rgba(255,255,255,0.14)"
                      }}>
                        {s.text}
                        {i === step && i !== BOOT_STEPS.length - 1 && (
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity }}
                            className="ml-1"
                          >_</motion.span>
                        )}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-[440px]"
            >
              <div className="h-px bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: accessGranted
                      ? "linear-gradient(90deg, rgba(34,197,94,0.6), #22c55e)"
                      : "linear-gradient(90deg, rgba(245,158,11,0.4), #f59e0b)",
                    boxShadow: accessGranted
                      ? "0 0 10px rgba(34,197,94,0.6)"
                      : "0 0 10px rgba(245,158,11,0.5)",
                    transition: "width 0.12s linear",
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[8px] text-white/12 font-mono tracking-wider">
                <span>ML · GDELT · ReliefWeb · Wikipedia</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </motion.div>

          </div>

          {/* Corner labels */}
          <div className="absolute top-5 left-6 text-[8px] font-mono text-white/15 space-y-1 leading-relaxed">
            <p className="tracking-wider">CRZP_v4.0 // CLASSIFIED</p>
            <p style={{ color: "rgba(245,158,11,0.35)" }}>◈ SECURE_CHANNEL_ACTIVE</p>
          </div>
          <div className="absolute top-5 right-6 text-right text-[8px] font-mono text-white/15 space-y-1 leading-relaxed">
            <p>{new Date().toUTCString().slice(0, 16)} UTC</p>
            <p>LAT: 34.05°N // LON: 118.24°W</p>
          </div>
          <div className="absolute bottom-5 left-6 text-[8px] font-mono text-white/10 tracking-[0.25em]">
            GEOINT · OSINT · HUMINT · SIGINT
          </div>
          <div className="absolute bottom-5 right-6 text-right text-[8px] font-mono">
            <AnimatePresence mode="wait">
              {accessGranted ? (
                <motion.span
                  key="granted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6, 1] }}
                  transition={{ duration: 0.5 }}
                  style={{ color: "#22c55e" }}
                  className="tracking-wider"
                >
                  ✓ ACCESS GRANTED
                </motion.span>
              ) : (
                <motion.span
                  key="auth"
                  className="text-white/15 tracking-wider"
                >
                  AUTHENTICATING...
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ACCESS GRANTED full-screen flash */}
          <AnimatePresence>
            {accessGranted && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.12, 0] }}
                transition={{ duration: 0.6 }}
                style={{ background: "#22c55e" }}
              />
            )}
          </AnimatePresence>

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
