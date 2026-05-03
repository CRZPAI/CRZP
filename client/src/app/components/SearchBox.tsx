import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2, X, Mic, MicOff } from "lucide-react";
import { useLocationsSearch } from "@/hooks/use-locations";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { type LocationSuggestion } from "@shared/schema";

export interface SelectedLocation {
  displayName: string;
  lat: number;
  lon: number;
}

interface SearchBoxProps {
  onSelect: (loc: SelectedLocation) => void;
  className?: string;
  autoFocus?: boolean;
  /** Fires on external Cmd+K / "/" keypress to focus the input */
  externalFocusTrigger?: number;
}

const SR = typeof window !== "undefined"
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  : null;

export function SearchBox({ onSelect, className, autoFocus = false, externalFocusTrigger }: SearchBoxProps) {
  const [query, setQuery]       = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef    = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recogRef    = useRef<any>(null);
  const debouncedQ  = useDebounce(query, 400);

  const { data: suggestions, isLoading } = useLocationsSearch(debouncedQ);
  const showDropdown = isFocused && query.length >= 2;

  // External focus trigger (Cmd+K / "/")
  useEffect(() => {
    if (externalFocusTrigger) inputRef.current?.focus();
  }, [externalFocusTrigger]);

  // Click outside
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setIsFocused(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSelect = (s: LocationSuggestion) => {
    setQuery(s.display_name);
    setIsFocused(false);
    onSelect({ displayName: s.display_name, lat: parseFloat(s.lat), lon: parseFloat(s.lon) });
  };

  const handleClear = () => { setQuery(""); setIsFocused(true); inputRef.current?.focus(); };

  // Voice search
  const toggleVoice = useCallback(() => {
    if (!SR) return;
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setQuery(t);
      setIsFocused(true);
      setListening(false);
    };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  }, [listening]);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl mx-auto z-50", className)}>
      <div
        className={cn(
          "relative flex items-center w-full bg-card border rounded-xl transition-all duration-150",
          isFocused || listening
            ? "border-primary shadow-[0_0_0_3px_hsl(213_94%_68%_/_0.12)]"
            : "border-border hover:border-border/80",
        )}
      >
        <div className="pl-4 pr-2 text-muted-foreground flex-shrink-0">
          {isLoading && query.length >= 2 ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Search className={cn("w-4 h-4 transition-colors", (isFocused || listening) && "text-primary")} />
          )}
        </div>

        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={e => {
            if (e.key === "Enter" && suggestions?.length) handleSelect(suggestions[0]);
            if (e.key === "Escape") { setIsFocused(false); inputRef.current?.blur(); }
          }}
          placeholder="Search city, region, or country…"
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 py-3 pr-2"
          data-testid="input-search"
        />

        <div className="flex items-center gap-1 pr-3">
          {query && (
            <button onClick={handleClear} className="text-muted-foreground/60 hover:text-foreground p-1 rounded transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {SR && (
            <button
              onClick={toggleVoice}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                listening
                  ? "text-red-400 bg-red-500/10 animate-pulse"
                  : "text-muted-foreground/60 hover:text-primary hover:bg-primary/10",
              )}
              title="Voice search"
              data-testid="button-voice-search"
            >
              {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-muted-foreground/40 border border-border/50 rounded bg-muted/30">
            /
          </kbd>
        </div>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {suggestions && suggestions.length > 0 ? (
              <ul className="max-h-[280px] overflow-y-auto custom-scrollbar py-1">
                {suggestions.map((s, i) => (
                  <li key={s.place_id || i}>
                    <button
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors"
                      onClick={() => handleSelect(s)}
                      data-testid={`suggestion-${i}`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{s.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : !isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No locations found for "{query}"
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
