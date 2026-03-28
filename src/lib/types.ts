export type StyleId = 'casual' | 'informative' | 'review' | 'food_review' | 'marketing' | 'story';
export type LengthId = 'short' | 'medium' | 'long' | 'standard' | 'deep' | 'premium';
export type ToneId = 'haeyoche' | 'banmal';
export type PersonaId =
  | 'beauty' | 'food' | 'tech' | 'travel'
  | 'selfdev' | 'parenting' | 'finance' | 'interior'
  | 'custom';
export type GenerationMode = 'quick' | 'quality';
export type GenerationStatus = 'running' | 'completed' | 'failed';
export type PublishStatus = 'none' | 'draft' | 'published' | 'failed';

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

export interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export type TitleStyle = 'number' | 'question' | 'tip' | 'auto';

export interface GenerateRequest {
  topic: string;
  keywords?: string[];
  style?: StyleId;
  length?: LengthId;
  mode?: GenerationMode;
  tone?: ToneId;
  persona?: PersonaId;
  additionalInfo?: string;
  imageIds?: string[];
  naturalize?: boolean;
  includeFaq?: boolean;
  lsiKeywords?: string[];
  titleStyle?: TitleStyle;
}

export interface GenerationRecord {
  id: string;
  topic: string;
  keywords: string[];
  style: StyleId;
  length: LengthId;
  mode: GenerationMode;
  tone: ToneId | null;
  persona: PersonaId | null;
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
  naturalizationScore: number | null;
  naturalizationChanges: NaturalizationChange[] | null;
  naverPostId: string | null;
  naverPostUrl: string | null;
  publishedAt: string | null;
  publishStatus: PublishStatus;
}

export interface NaturalizationChange {
  type: 'vocab' | 'sentence' | 'experience' | 'structure' | 'conjunction';
  original: string;
  replaced: string;
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
  suggestions?: string[];
}

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  emojiSet: string[];
  structureTemplate: string;
}

export interface NaverBlogConfig {
  blogId: string;
  password: string;
}

export interface ScheduledPost {
  id: string;
  topic: string;
  keywords: string[];
  style: StyleId;
  length: LengthId;
  persona: PersonaId | null;
  tone: ToneId | null;
  scheduledAt: string;
  generationId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  autoPublish: boolean;
  createdAt: string;
}

export interface KeywordResearch {
  id: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  userNotes: string | null;
  manualVolume: number | null;
  manualDifficulty: number | null;
  createdAt: string;
}

export interface PostMetric {
  id: string;
  generationId: string;
  recordedAt: string;
  views: number | null;
  uniqueVisitors: number | null;
  keywordRank: number | null;
  keyword: string | null;
  notes: string | null;
}

export interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  type: 'input' | 'textarea' | 'rating' | 'toggle' | 'select';
  rows?: number;
  group?: string;
  options?: string[];
}

export type TemplateData = Record<string, string>;
