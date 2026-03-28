'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Zap, Crown, Loader2, Image as ImageIcon, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { TagInput } from './tag-input';
import { ImageUpload } from './image-upload';
import { PersonaSelector } from './persona-selector';
import { StyleTemplateFields } from './style-template-fields';
import { STYLE_OPTIONS, LENGTH_OPTIONS } from '@/lib/prompts';
import { serializeTemplateData, getStyleSpecificKeys, deserializeTemplateData } from '@/lib/style-templates';
import type { StyleId, LengthId, GenerationMode, ToneId, PersonaId, StyleProfile, UploadedImage, TemplateData, TemplateField, TitleStyle } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CustomStyle {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  systemPrompt: string;
  fields: TemplateField[];
}

export function GenerateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [style, setStyle] = useState<StyleId>('casual');
  const [length, setLength] = useState<LengthId>('standard');
  const [mode, setMode] = useState<GenerationMode>('quick');
  const [tone, setTone] = useState<ToneId>('haeyoche');
  const [persona, setPersona] = useState<PersonaId | null>(null);
  const [naturalize, setNaturalize] = useState(false);
  const [templateData, setTemplateData] = useState<TemplateData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 스타일 프로필
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  // 이미지 첨부
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // 이미지 생성
  const [klingConfigured, setKlingConfigured] = useState(false);
  const [generateImages, setGenerateImages] = useState(false);

  // 커스텀 스타일
  const [customStyles, setCustomStyles] = useState<CustomStyle[]>([]);

  useEffect(() => {
    fetch('/api/style-profile')
      .then(r => r.json())
      .then(setProfiles)
      .catch(() => {});

    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setKlingConfigured(data.kling?.configured || false))
      .catch(() => {});

    fetch('/api/custom-styles')
      .then(r => r.json())
      .then(setCustomStyles)
      .catch(() => {});
  }, []);

  // 스타일 변경 시 이전 스타일 전용 필드 초기화 (freeform 보존)
  const prevStyleRef = useRef(style);
  useEffect(() => {
    const prevStyle = prevStyleRef.current;
    if (prevStyle !== style) {
      const keysToReset = getStyleSpecificKeys(prevStyle);
      if (keysToReset.length > 0) {
        setTemplateData(prev => {
          const next = { ...prev };
          for (const key of keysToReset) {
            delete next[key];
          }
          return next;
        });
      }
      prevStyleRef.current = style;
    }
  }, [style]);

  // 외부에서 넘어온 파라미터 처리 (키워드 페이지, 히스토리 재사용)
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    const keywordsParam = searchParams.get('keywords');
    const styleParam = searchParams.get('style') as StyleId | null;
    const toneParam = searchParams.get('tone') as ToneId | null;
    const lengthParam = searchParams.get('length') as LengthId | null;
    const personaParam = searchParams.get('persona') as PersonaId | null;
    const additionalInfoParam = searchParams.get('additionalInfo');

    if (topicParam) setTopic(topicParam);
    if (keywordsParam) setKeywords(keywordsParam.split(',').filter(Boolean));
    if (styleParam && ['casual','informative','review','food_review','marketing','story'].includes(styleParam)) {
      setStyle(styleParam);
    }
    if (toneParam && ['haeyoche','banmal'].includes(toneParam)) setTone(toneParam);
    if (lengthParam) setLength(lengthParam);
    if (personaParam) setPersona(personaParam);
    if (additionalInfoParam && styleParam) {
      const decoded = decodeURIComponent(additionalInfoParam);
      setTemplateData(deserializeTemplateData(decoded, styleParam));
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      setError('주제를 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 커스텀 스타일인 경우 실제 스타일은 'casual'로, 커스텀 프롬프트를 additionalInfo에 합류
      const isCustom = style.startsWith('custom:');
      const actualStyle = isCustom ? 'casual' : style;
      const customStyle = isCustom ? customStyles.find(cs => `custom:${cs.id}` === style) : null;

      const additionalInfo = serializeTemplateData(templateData, isCustom ? 'casual' : style);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic, keywords, style: actualStyle as StyleId, length, mode, tone, persona,
          naturalize, additionalInfo: additionalInfo || undefined,
          customSystemPrompt: customStyle?.systemPrompt || undefined,
          styleProfileId: selectedProfile || null,
          generateImages,
          imageIds: uploadedImages.map(img => img.id),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '생성 요청 실패');
        setLoading(false);
        return;
      }

      router.push(`/result/${data.id}`);
    } catch {
      setError('서버 연결에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 주제 입력 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">주제</label>
        <Textarea
          placeholder="블로그 글의 주제를 입력하세요. 예: 서울 카페 추천, ChatGPT 활용법..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
        />
      </div>

      {/* 키워드 입력 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">키워드 (선택)</label>
        <TagInput tags={keywords} onChange={setKeywords} />
      </div>

      {/* 스타일 선택 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">글쓰기 스타일</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STYLE_OPTIONS.map((opt) => (
            <Card
              key={opt.id}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                style === opt.id && 'border-primary ring-1 ring-primary',
              )}
              onClick={() => setStyle(opt.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{opt.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{opt.name}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {customStyles.map((cs) => (
            <Card
              key={`custom-${cs.id}`}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                style === (`custom:${cs.id}` as StyleId) && 'border-primary ring-1 ring-primary',
              )}
              onClick={() => setStyle(`custom:${cs.id}` as StyleId)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cs.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{cs.name}</div>
                    <div className="text-xs text-muted-foreground">{cs.description || '커스텀 스타일'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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

      {/* 이미지 첨부 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">이미지 첨부 (선택)</label>
        <ImageUpload images={uploadedImages} onChange={setUploadedImages} />
        <p className="text-xs text-muted-foreground">
          첨부된 이미지를 AI가 분석하여 글의 적절한 위치에 삽입합니다.
        </p>
      </div>

      {/* 스타일별 추가 입력 + 자유 입력 */}
      <StyleTemplateFields
        style={style}
        data={templateData}
        onChange={setTemplateData}
        customFields={style.startsWith('custom:')
          ? customStyles.find(cs => `custom:${cs.id}` === style)?.fields
          : undefined
        }
      />

      {/* 에러 메시지 */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* 생성 버튼 */}
      <Button onClick={handleSubmit} disabled={loading || !topic.trim()} className="w-full" size="lg">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            블로그 글 생성
          </>
        )}
      </Button>
    </div>
  );
}
