import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { riskScoreResponseSchema, compareResponseSchema } from "@shared/schema";

export function useRiskAnalysis(location: string | null, autoRefreshMs?: number) {
  const [freshNonce, setFreshNonce] = useState(0);

  useEffect(() => {
    setFreshNonce(0);
  }, [location]);

  const query = useQuery({
    queryKey: [api.risk.analyze.path, location, freshNonce],
    queryFn: async () => {
      if (!location) return null;
      const params: Record<string, string | number> = { location };
      if (freshNonce > 0) {
        params.fresh = "true";
      }
      const url = buildUrl(api.risk.analyze.path, params);
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) throw new Error(`Risk analysis failed for ${location}`);
      const data = await res.json();
      return riskScoreResponseSchema.parse(data);
    },
    enabled: !!location,
    staleTime: autoRefreshMs ?? 1000 * 60 * 5,
    refetchInterval: autoRefreshMs,
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    refreshFreshly: () => setFreshNonce((value) => value + 1),
  };
}

export function useCompare(loc1: string | null, loc2: string | null) {
  return useQuery({
    queryKey: [api.risk.compare.path, loc1, loc2],
    queryFn: async () => {
      if (!loc1 || !loc2) return null;
      const url = buildUrl(api.risk.compare.path, { loc1, loc2 });
      const res = await fetch(url, { credentials: "omit" });
      if (!res.ok) throw new Error("Compare request failed");
      const data = await res.json();
      return compareResponseSchema.parse(data);
    },
    enabled: !!loc1 && !!loc2,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
