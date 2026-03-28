'use client';

import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/tag-input';

interface TopicSectionProps {
  topic: string;
  setTopic: (v: string) => void;
  keywords: string[];
  setKeywords: (v: string[]) => void;
}

export function TopicSection({ topic, setTopic, keywords, setKeywords }: TopicSectionProps) {
  return (
    <>
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
    </>
  );
}
