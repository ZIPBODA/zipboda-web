export type ScoreFactorKey = "housing" | "dependents" | "account";

export interface ScoreStep {
  label: string;
  points: number;
}

export interface ScoreFactor {
  key: ScoreFactorKey;
  icon: string;
  title: string;
  subtitle: string;
  shortLabel: string;
  max: number;
  defaultStep: number;
  steps: ScoreStep[];
}

export interface GradeBand {
  min: number;
  label: string;
  tone: string;
  desc: string;
}
