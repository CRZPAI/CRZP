import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props { color: string; trigger: string | number }

export function RippleReveal({ color, trigger }: Props) {
  const [rings, setRings] = useState<number[]>([]);

  useEffect(() => {
    if (!trigger) return;
    setRings([1, 2, 3]);
    const id = setTimeout(() => setRings([]), 2000);
    return () => clearTimeout(id);
  }, [trigger]);

  return (
    <AnimatePresence>
      {rings.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {rings.map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{ borderColor: color }}
              initial={{ width: 60, height: 60, opacity: 0.8 }}
              animate={{ width: 240, height: 240, opacity: 0 }}
              transition={{ duration: 1.6, delay: i * 0.3, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
