import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, X, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  angle: (i / 18) * 360,
  color: i % 3 === 0 ? "#f59e0b" : i % 3 === 1 ? "#fbbf24" : "#fde68a",
  size: 4 + (i % 3) * 2,
  distance: 48 + (i % 4) * 18,
}));

function BurstParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.7, ease: [0.2, 0, 0.4, 1], delay: p.id * 0.012 }}
        />
      ))}
    </div>
  );
}

export function FeedbackButton() {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState("");
  const [input, setInput]       = useState("");
  const [rating, setRating]     = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [sending, setSending]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [burst, setBurst]       = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setName(""); setInput(""); setRating(null);
    setSubmitted(false); setBurst(false); setOpen(false);
  };

  const submit = async () => {
    const text = input.trim();
    if (!text) return toast({ title: "Write something first" });
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message: text, rating }),
      });
      if (res.ok) {
        setBurst(true);
        setTimeout(() => { setBurst(false); setSubmitted(true); }, 750);
      } else {
        toast({ title: "Couldn't submit", description: "Please try again." });
      }
    } catch {
      toast({ title: "Connection error", description: "Check your connection and retry." });
    } finally {
      setSending(false);
    }
  };

  const inputBase =
    "w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/[0.07] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-400/40 focus:bg-white/[0.06] transition-all duration-200";

  const activeRating = hoverRating ?? rating;

  return (
    <>
      {/* FAB */}
      <motion.button
        aria-label="Open feedback"
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-5 bottom-[72px] z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 text-black text-xs font-black uppercase tracking-wider shadow-xl shadow-amber-500/30 hover:bg-amber-400 transition-colors"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0.2, 1] }}
            className="fixed right-5 bottom-[140px] z-50 w-[340px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(5,8,20,0.98)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(28px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-400/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white/90 tracking-wide">Share Feedback</p>
                  <p className="text-[10px] text-white/25">Your thoughts matter</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {burst ? (
                /* ── Burst state (brief) ── */
                <motion.div
                  key="burst"
                  className="relative px-6 py-10 flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <BurstParticles />
                  <motion.div
                    className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [0.5, 1.3, 1] }}
                    transition={{ duration: 0.5, ease: "backOut" }}
                  >
                    <motion.span
                      className="text-2xl"
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      ❤️
                    </motion.span>
                  </motion.div>
                </motion.div>
              ) : submitted ? (
                /* ── Thank-you state ── */
                <motion.div
                  key="thanks"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="px-5 py-7 flex flex-col items-center text-center gap-4"
                >
                  <div className="w-13 h-13 rounded-full bg-amber-500/10 border border-amber-400/20 flex items-center justify-center p-3.5">
                    <span className="text-2xl">🙏</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[15px] font-bold text-white/90 tracking-tight">Thank you so much!</p>
                    <p className="text-[11.5px] text-white/40 leading-relaxed max-w-[240px]">
                      Your feedback truly means the world and makes CRZP better every single day.
                    </p>
                    <motion.p
                      className="text-[12px] text-amber-400/70 mt-1 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      جزاك الله خيراً ✨
                    </motion.p>
                  </div>
                  <motion.button
                    onClick={reset}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-1 px-5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/40 text-[11px] font-semibold hover:bg-white/[0.08] hover:text-white/60 transition-all"
                  >
                    Close
                  </motion.button>
                </motion.div>
              ) : (
                /* ── Form state ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-4 space-y-3"
                >
                  {/* Founder message card */}
                  <div
                    className="rounded-xl p-3.5 space-y-2.5"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(245,158,11,0.12)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black text-black flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}
                      >
                        A
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white/80 leading-none">Anas</p>
                        <p className="text-[9.5px] text-amber-400/60 mt-0.5 tracking-wide uppercase font-semibold">Founder · CRZP</p>
                      </div>
                    </div>
                    <p className="text-[11.5px] text-white/50 leading-relaxed pl-[2px]">
                      Hey! I personally read every message sent here. Whether it's a bug, idea, or just a thought — I'd genuinely love to hear it. 🙏
                    </p>
                  </div>

                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className={inputBase}
                  />

                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Your message…"
                    className={`${inputBase} resize-none`}
                    rows={4}
                  />

                  {/* Rating + Send row */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div
                      className="flex items-center gap-1"
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      {[1, 2, 3, 4, 5].map(n => (
                        <motion.button
                          key={n}
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHoverRating(n)}
                          whileTap={{ scale: 1.3 }}
                          className="p-0.5 rounded transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 transition-colors duration-100 ${
                              activeRating && n <= activeRating
                                ? "text-amber-400"
                                : "text-white/15"
                            }`}
                            fill={activeRating && n <= activeRating ? "currentColor" : "none"}
                          />
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      onClick={submit}
                      disabled={sending || !input.trim()}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-black text-[11px] font-black uppercase tracking-wider disabled:opacity-35 transition-all"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}
                    >
                      <Send className="w-3 h-3" />
                      {sending ? "Sending…" : "Send"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FeedbackButton;
