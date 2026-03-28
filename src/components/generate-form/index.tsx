'use client';

import { useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StyleTemplateFields } from '@/components/style-template';
import { serializeTemplateData, getStyleSpecificKeys } from '@/lib/style-templates';
import type { StyleProfile } from '@/lib/types';
import { useFormState } from './hooks/use-form-state';
import { useFormInit } from './hooks/use-form-init';
import { useExternalData } from './hooks/use-external-data';
import { TopicSection } from './sections/topic-section';
import { StyleSection } from './sections/style-section';
import { OptionsSection } from './sections/options-section';
import { MediaSection } from './sections/media-section';
import { useState } from 'react';

export function GenerateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    topic, setTopic,
    keywords, setKeywords,
    style, setStyle,
    length, setLength,
    mode, setMode,
    tone, setTone,
    persona, setPersona,
    naturalize, setNaturalize,
    templateData, setTemplateData,
    loading, setLoading,
    error, setError,
    selectedProfile, setSelectedProfile,
    uploadedImages, setUploadedImages,
    klingConfigured, setKlingConfigured,
    generateImages, setGenerateImages,
    customStyles, setCustomStyles,
  } = useFormState();

  const [profiles, setProfiles] = useState<StyleProfile[]>([]);

  // 외부 데이터 fetch
  useExternalData({ setProfiles, setKlingConfigured, setCustomStyles });

  // searchParams 초기화
  useFormInit({
    setTopic, setKeywords, setStyle, setTone, setLength, setPersona,
    setTemplateData: (v) => setTemplateData(v),
  });

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
  }, [style, setTemplateData]);

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
          topic, keywords, style: actualStyle, length, mode, tone, persona,
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
      <TopicSection
        topic={topic}
        setTopic={setTopic}
        keywords={keywords}
        setKeywords={setKeywords}
      />

      <StyleSection
        style={style}
        setStyle={setStyle}
        customStyles={customStyles}
      />

      <OptionsSection
        tone={tone}
        setTone={setTone}
        length={length}
        setLength={setLength}
        mode={mode}
        setMode={setMode}
        naturalize={naturalize}
        setNaturalize={setNaturalize}
        klingConfigured={klingConfigured}
        generateImages={generateImages}
        setGenerateImages={setGenerateImages}
        persona={persona}
        setPersona={setPersona}
        profiles={profiles}
        selectedProfile={selectedProfile}
        setSelectedProfile={setSelectedProfile}
      />

      <MediaSection
        uploadedImages={uploadedImages}
        setUploadedImages={setUploadedImages}
      />

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
