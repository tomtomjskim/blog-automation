'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ tags, onChange, placeholder = '키워드 입력 후 Enter', maxTags = 10 }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = (value: string) => {
    const tag = value.trim();
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 rounded-md border border-input p-2 focus-within:ring-1 focus-within:ring-ring">
      {tags.map((tag, i) => (
        <Badge key={i} variant="secondary" className="gap-1">
          {tag}
          <button type="button" onClick={() => removeTag(i)} className="ml-0.5 hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length >= maxTags ? `최대 ${maxTags}개` : placeholder}
        disabled={tags.length >= maxTags}
        className="h-7 min-w-[120px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
