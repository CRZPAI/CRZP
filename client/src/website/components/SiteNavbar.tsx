import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Github, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SiteNavbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.querySelector("[data-landing-scroll]") as HTMLElement | null;
    const target = el ?? window;
    const handler = () => {
      const top = el ? el.scrollTop : window.scrollY;
      setScrolled(top > 24);
    };
    target.addEventListener("scroll", handler, { passive: true });
    return () => target.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[80] transition-all duration-500",
        scrolled
          ? "backdrop-blur-2xl border-b border-white/[0.06] bg-[#020617]/85"
          : "backdrop-blur-md border-b border-transparent bg-transparent"
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 h-[60px] flex items-center justify-between">

        {/* Brand */}
        <Link href="/landing">
          <div className="flex items-center gap-3 group cursor-pointer">
            {/* Logo mark */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-amber-500 opacity-90 group-hover:opacity-100 transition-opacity" />
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="relative z-10">
                <circle cx="9" cy="9" r="6" stroke="black" strokeWidth="1.2" fill="none" />
                <ellipse cx="9" cy="9" rx="3" ry="6" stroke="black" strokeWidth="0.9" fill="none" />
                <line x1="3" y1="9" x2="15" y2="9" stroke="black" strokeWidth="0.9" />
                <circle cx="9" cy="9" r="1.2" fill="black" />
              </svg>
            </div>
            {/* Wordmark */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-black uppercase tracking-[0.15em] text-white leading-none">CRZP</span>
              <span className="text-[15px] font-black uppercase tracking-[0.15em] text-amber-400 leading-none">APEX</span>
            </div>
            {/* Live dot */}
            <div className="flex items-center gap-1.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-[7px] font-black text-red-400/60 uppercase tracking-[0.3em]">Live</span>
            </div>
          </div>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/landing" active={location === "/landing"}>Home</NavLink>
          <NavLink href="/docs" active={location === "/docs"}>
            <BookOpen className="w-3 h-3 opacity-60" />
            Docs
          </NavLink>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://x.com/crzp_ai"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.07] transition-all"
            title="X (Twitter)"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://github.com/i-anasop/CRZP"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 h-8 px-3.5 rounded-lg border border-white/[0.07] bg-white/[0.025] text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/[0.06] hover:text-white/70 hover:border-white/12 transition-all"
          >
            <Github className="w-3 h-3" />
            GitHub
          </a>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 h-8 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider hover:bg-amber-400 transition-colors shadow-[0_0_24px_rgba(245,158,11,0.22)] ml-1"
            >
              <Zap className="w-3 h-3" />
              Launch App
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <div className={cn(
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer",
        active
          ? "bg-white/[0.06] text-white border border-white/[0.08]"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
      )}>
        {children}
      </div>
    </Link>
  );
}
