import { Link } from "wouter";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] px-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-amber-500/20 bg-amber-500/10 mb-6">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/70 mb-3">Error 404</p>
        <h1 className="text-3xl font-black text-white tracking-tight mb-3">Zone not found</h1>
        <p className="text-sm text-white/40 leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-[0.15em] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
