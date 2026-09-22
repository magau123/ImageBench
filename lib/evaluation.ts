import type { ModelSlot } from "./provider-config.ts";
import type { ScoreDimension } from "./benchmarks.ts";

export type Scores = Partial<Record<ScoreDimension, number>>;

export interface GenerationResult {
  slotId: string;
  provider: string;
  modelId: string;
  image?: string;
  mediaType?: string;
  elapsed?: number;
  error?: string;
  scores: Scores;
  winner?: boolean;
}

export interface EvaluationSession {
  id: string;
  createdAt: string;
  title: string;
  prompt: string;
  benchmarkId?: string;
  slots: Array<Omit<ModelSlot, "apiKey">>;
  results: GenerationResult[];
}

export const averageScore = (scores: Scores) => {
  const values = Object.values(scores).filter(
    (value): value is number => typeof value === "number",
  );
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
};
