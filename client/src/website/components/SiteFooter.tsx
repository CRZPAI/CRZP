import React from "react";
import { Link } from "wouter";
import { Globe, Github } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/5 bg-black/80 backdrop-blur-3xl py-4 px-6 md:px-12 lg:px-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/landing">
            <div className="flex items-center gap-2 cursor-pointer group">
              <Globe className="w-4 h-4 text-amber-500" />
              <span className="text-lg font-black text-white tracking-tighter uppercase">CRZP</span>
            </div>
          </Link>
          <div className="hidden md:block w-px h-4 bg-white/10" />
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
            © {currentYear} CRZP APEX — All rights reserved
          </p>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com/i-anasop"
            target="_blank"
            rel="noreferrer"
            className="text-slate-600 hover:text-amber-500 transition-all flex items-center gap-2"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono uppercase tracking-widest hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://x.com/i_anasop"
            target="_blank"
            rel="noreferrer"
            className="text-slate-600 hover:text-amber-500 transition-all flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            <span className="text-[9px] font-mono uppercase tracking-widest hidden sm:inline">@i_anasop</span>
          </a>
          <div className="w-px h-4 bg-white/10" />
          <Link href="/docs">
            <span className="text-[9px] font-black text-slate-600 hover:text-amber-500 uppercase tracking-widest transition-colors cursor-pointer">Docs</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
