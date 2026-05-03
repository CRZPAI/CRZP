import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { locationSuggestionSchema } from "@shared/schema";
import { z } from "zod";

export function useLocationsSearch(query: string) {
  return useQuery({
    queryKey: [api.locations.search.path, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const url = buildUrl(api.locations.search.path, { q: query });
      const res = await fetch(url, { credentials: "omit" }); // Assuming no auth needed for public search
      
      if (!res.ok) {
        throw new Error("Failed to fetch locations");
      }
      
      const data = await res.json();
      // Validate array of suggestions
      return z.array(locationSuggestionSchema).parse(data);
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
