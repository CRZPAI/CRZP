import { z } from "zod";

export const locationSuggestionSchema = z.object({
  place_id: z.string(),
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
});

export const incidentSchema = z.object({
  title: z.string(),
  description: z.string(),
  source: z.string(),
  date: z.string(),
  severity: z.string(),
  timestamp: z.string().optional(),
  is_realtime: z.boolean().optional(),
  category: z.string().optional(),
  url: z.string().optional(),
});

export const newsArticleSchema = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  date: z.string(),
  sentiment: z.string(),
  is_realtime: z.boolean().optional(),
});

export const riskBreakdownSchema = z.object({
  military: z.number(),
  political: z.number(),
  economic: z.number(),
  social: z.number(),
  humanitarian: z.number(),
});

export const trendPointSchema = z.object({
  date: z.string(),
  score: z.number(),
  day: z.number().optional(),
});

export const newsStatsSchema = z.object({
  total: z.number(),
  negative: z.number(),
  positive: z.number(),
  neutral: z.number(),
});

export const countryProfileSchema = z.object({
  name: z.string(),
  capital: z.string().optional(),
  population: z.number().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  area: z.number().optional(),
  flag: z.string().optional(),
  continents: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  currencies: z.array(z.string()).optional(),
});

export const wikiSummarySchema = z.object({
  title:   z.string(),
  summary: z.string(),
  url:     z.string().optional(),
});

export const escalationMomentumSchema = z.object({
  signal:         z.string(),
  label:          z.string(),
  ratio:          z.number(),
  recentCount:    z.number(),
  baselineCount:  z.number(),
  confidence:     z.number(),
  description:    z.string(),
});

export const mlPredictionSchema = z.object({
  score:         z.number(),
  tier:          z.string(),
  probabilities: z.record(z.string(), z.number()),
  confidence:    z.number(),
  features:      z.object({
    fsi:      z.number(),
    gpiRank:  z.number(),
    region:   z.number(),
    conflict: z.number(),
  }).optional(),
});

export const modelInfoSchema = z.object({
  model_type:           z.string(),
  voting:               z.string(),
  n_features:           z.number(),
  feature_names:        z.array(z.string()),
  feature_importances:  z.record(z.string(), z.number()),
  n_training_samples:   z.number(),
  label_names:          z.array(z.string()),
  training_sources:     z.array(z.string()),
  cv_accuracy_mean:     z.number(),
  cv_accuracy_std:      z.number(),
  cv_folds:             z.number(),
  train_accuracy:       z.number(),
  test_accuracy:        z.number(),
  class_distribution:   z.record(z.string(), z.number()),
  per_class_f1:         z.record(z.string(), z.number()),
  confusion_matrix:     z.array(z.array(z.number())),
});

export const riskScoreResponseSchema = z.object({
  location: z.string(),
  riskScore: z.number(),
  riskLevel: z.string(),
  factors: z.array(z.string()),
  breakdown: riskBreakdownSchema.optional(),
  trend: z.array(trendPointSchema).optional(),
  incidents: z.array(incidentSchema),
  news: z.array(newsArticleSchema).optional(),
  newsStats: newsStatsSchema.optional(),
  countryProfile: countryProfileSchema.optional().nullable(),
  conflictEvents: z.array(newsArticleSchema).optional(),
  wikiSummary: wikiSummarySchema.optional().nullable(),
  escalationMomentum: escalationMomentumSchema.optional().nullable(),
  mlPrediction: mlPredictionSchema.optional().nullable(),
  lastUpdated: z.string().optional(),
  dataSourcesUsed: z.array(z.string()).optional(),
  scoringDebug: z.any().optional(),
});

export const compareResponseSchema = z.object({
  location1: riskScoreResponseSchema,
  location2: riskScoreResponseSchema,
});

export type LocationSuggestion = z.infer<typeof locationSuggestionSchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type NewsArticle = z.infer<typeof newsArticleSchema>;
export type RiskBreakdown = z.infer<typeof riskBreakdownSchema>;
export type TrendPoint = z.infer<typeof trendPointSchema>;
export type NewsStats = z.infer<typeof newsStatsSchema>;
export type CountryProfile = z.infer<typeof countryProfileSchema>;
export type EscalationMomentum = z.infer<typeof escalationMomentumSchema>;
export type MlPrediction = z.infer<typeof mlPredictionSchema>;
export type ModelInfo = z.infer<typeof modelInfoSchema>;
export type RiskScoreResponse = z.infer<typeof riskScoreResponseSchema>;
export type CompareResponse = z.infer<typeof compareResponseSchema>;
