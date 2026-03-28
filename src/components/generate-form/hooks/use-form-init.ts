import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { deserializeTemplateData } from '@/lib/style-templates';
import type { StyleId, LengthId, ToneId, PersonaId, TemplateData } from '@/lib/types';

interface UseFormInitProps {
  setTopic: (v: string) => void;
  setKeywords: (v: string[]) => void;
  setStyle: (v: StyleId) => void;
  setTone: (v: ToneId) => void;
  setLength: (v: LengthId) => void;
  setPersona: (v: PersonaId | null) => void;
  setTemplateData: (v: TemplateData) => void;
}

// searchParams에서 초기값을 파싱하여 폼 상태를 초기화하는 훅
export function useFormInit({
  setTopic,
  setKeywords,
  setStyle,
  setTone,
  setLength,
  setPersona,
  setTemplateData,
}: UseFormInitProps) {
  const searchParams = useSearchParams();

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
    if (styleParam && ['casual', 'informative', 'review', 'food_review', 'marketing', 'story'].includes(styleParam)) {
      setStyle(styleParam);
    }
    if (toneParam && ['haeyoche', 'banmal'].includes(toneParam)) setTone(toneParam);
    if (lengthParam) setLength(lengthParam);
    if (personaParam) setPersona(personaParam);
    if (additionalInfoParam && styleParam) {
      const decoded = decodeURIComponent(additionalInfoParam);
      setTemplateData(deserializeTemplateData(decoded, styleParam));
    }
  }, [searchParams, setTopic, setKeywords, setStyle, setTone, setLength, setPersona, setTemplateData]);
}
