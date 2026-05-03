import { z } from 'zod';
import { locationSuggestionSchema, riskScoreResponseSchema, compareResponseSchema } from './schema';

export const errorSchemas = {
  internal: z.object({ message: z.string() }),
};

export const api = {
  locations: {
    search: {
      method: 'GET' as const,
      path: '/api/locations/search',
      input: z.object({ q: z.string() }),
      responses: {
        200: z.array(locationSuggestionSchema),
        500: errorSchemas.internal,
      }
    }
  },
  risk: {
    analyze: {
      method: 'GET' as const,
      path: '/api/risk/analyze',
      input: z.object({ location: z.string() }),
      responses: {
        200: riskScoreResponseSchema,
        500: errorSchemas.internal,
      }
    },
    compare: {
      method: 'GET' as const,
      path: '/api/risk/compare',
      input: z.object({ loc1: z.string(), loc2: z.string() }),
      responses: {
        200: compareResponseSchema,
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      } else {
        query.append(key, String(value));
      }
    });
  }
  const queryString = query.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export type LocationSuggestionResponse = z.infer<typeof api.locations.search.responses[200]>;
export type RiskScoreResponseData = z.infer<typeof api.risk.analyze.responses[200]>;
export type CompareResponseData = z.infer<typeof api.risk.compare.responses[200]>;
