'use client';

import { Zap, Crown, Wand2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonaSelector } from '@/components/persona-selector';
import { LENGTH_OPTIONS } from '@/lib/prompts';
import type { LengthId, GenerationMode, ToneId, PersonaId, StyleProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface OptionsSectionProps {
  tone: ToneId;
  setTone: (v: ToneId) => void;
  length: LengthId;
  setLength: (v: LengthId) => void;
  mode: GenerationMode;
  setMode: (v: GenerationMode) => void;
  naturalize: boolean;
  setNaturalize: (v: boolean) => void;
  klingConfigured: boolean;
  generateImages: boolean;
  setGenerateImages: (v: boolean) => void;
  persona: PersonaId | null;
  setPersona: (v: PersonaId | null) => void;
  profiles: StyleProfile[];
  selectedProfile: string;
  setSelectedProfile: (v: string) => void;
}

export function OptionsSection({
  tone, setTone,
  length, setLength,
  mode, setMode,
  naturalize, setNaturalize,
  klingConfigured, generateImages, setGenerateImages,
  persona, setPersona,
  profiles, selectedProfile, setSelectedProfile,
}: OptionsSectionProps) {
  return (
    <>
      {/* 페르소나 선택 */}
      <PersonaSelector value={persona} onChange={setPersona} />

      {/* 톤 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">문체</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tone === 'haeyoche' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTone('haeyoche')}
          >
            해요체
          </Button>
          <Button
            type="button"
            variant={tone === 'banmal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTone('banmal')}
          >
            반말/~다체
          </Button>
        </div>
      </div>

      {/* 내 스타일 프로필 선택 */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">내 스타일 프로필 (선택)</label>
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">프로필 없이 기본 스타일 사용</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sampleCount}개 샘플 학습)
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            기존 글 스타일을 학습한 프로필을 적용합니다. 관리는 &quot;내 스타일&quot; 메뉴에서.
          </p>
        </div>
      )}

      {/* 길이 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">글 길이</label>
        <div className="flex flex-wrap gap-2">
          {LENGTH_OPTIONS.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={length === opt.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLength(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 모드 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">생성 모드</label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'quick' ? 'default' : 'outline'}
            onClick={() => setMode('quick')}
            className="flex-1"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            빠른 생성
          </Button>
          <Button
            type="button"
            variant={mode === 'quality' ? 'default' : 'outline'}
            onClick={() => setMode('quality')}
            className="flex-1"
          >
            <Crown className="mr-1.5 h-4 w-4" />
            고품질 생성
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === 'quick' ? 'Claude 1회 호출로 빠르게 생성합니다.' : 'Claude 2회 호출 (초안 + 고도화)으로 품질을 높입니다.'}
        </p>
      </div>

      {/* 자연화 토글 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">자연스러운 문체 변환</label>
          <button
            type="button"
            role="switch"
            aria-checked={naturalize}
            onClick={() => setNaturalize(!naturalize)}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
              naturalize ? 'bg-primary' : 'bg-input',
            )}
          >
            <span className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              naturalize ? 'translate-x-4' : 'translate-x-0',
            )} />
          </button>
        </div>
        {naturalize && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wand2 className="h-3 w-3" />
            AI 특유 표현을 자연스러운 구어체로 변환합니다 (추가 Claude 호출)
          </p>
        )}
      </div>

      {/* 이미지 생성 토글 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">이미지 자동생성</label>
          <button
            type="button"
            role="switch"
            aria-checked={generateImages}
            onClick={() => setGenerateImages(!generateImages)}
            disabled={!klingConfigured}
            className={cn(
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
              generateImages ? 'bg-primary' : 'bg-input',
              !klingConfigured && 'cursor-not-allowed opacity-50',
            )}
          >
            <span className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
              generateImages ? 'translate-x-4' : 'translate-x-0',
            )} />
          </button>
          {!klingConfigured && (
            <span className="text-xs text-muted-foreground">(Kling API 미설정)</span>
          )}
        </div>
        {generateImages && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="h-3 w-3" />
            Kling AI로 대표 이미지 2장을 자동 생성합니다 (~$0.03)
          </p>
        )}
      </div>
    </>
  );
}
