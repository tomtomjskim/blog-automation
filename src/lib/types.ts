export type StyleId = 'casual' | 'informative' | 'review' | 'food_review' | 'marketing' | 'story';
export type LengthId = 'short' | 'medium' | 'long';
export type GenerationMode = 'quick' | 'quality';
export type GenerationStatus = 'running' | 'completed' | 'failed';

export interface StyleOption {
  id: StyleId;
  name: string;
  icon: string;
  description: string;
}

export interface LengthOption {
  id: LengthId;
  chars: number;
  label: string;
}

export interface GenerateRequest {
  topic: string;
  keywords?: string[];
  style?: StyleId;
  length?: LengthId;
  mode?: GenerationMode;
  additionalInfo?: string;
}

export interface GenerationRecord {
  id: string;
  topic: string;
  keywords: string[];
  style: StyleId;
  length: LengthId;
  mode: GenerationMode;
  title: string | null;
  content: string | null;
  charCount: number | null;
  readTime: number | null;
  headings: string[] | null;
  seoScore: number | null;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationSec: number;
  status: GenerationStatus;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  imageUrls: string[];
  styleProfileId: string | null;
}

export interface StyleProfile {
  id: string;
  name: string;
  description: string | null;
  profile: string;
  sampleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationProgress {
  status: GenerationStatus;
  progress: string;
  error?: string;
}

export interface SeoItem {
  name: string;
  status: 'good' | 'warning' | 'error' | 'info';
  message: string;
  score: number;
}

export interface SeoAnalysis {
  score: number;
  maxScore: number;
  items: SeoItem[];
}
