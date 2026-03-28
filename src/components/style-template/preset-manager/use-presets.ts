import { useState, useEffect, useCallback } from 'react';
import type { StyleId, TemplateData } from '@/lib/types';

export interface Preset {
  id: string;
  name: string;
  type: string;
  style: string;
  data: Record<string, string>;
}

interface UsePresetsProps {
  style: StyleId;
  data: TemplateData;
  onChange: (data: TemplateData) => void;
}

// 프리셋 목록 fetch, 저장, 삭제를 처리하는 훅
export function usePresets({ style, data, onChange }: UsePresetsProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');

  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch(`/api/form-presets?style=${style}&type=template`);
      const result = await res.json();
      setPresets(result);
    } catch {}
  }, [style]);

  useEffect(() => {
    fetchPresets();
    setSelectedPresetId('');
  }, [fetchPresets]);

  const handleSavePreset = async () => {
    const name = prompt('프리셋 이름을 입력하세요:');
    if (!name?.trim()) return;
    try {
      await fetch('/api/form-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type: 'template', style, data }),
      });
      fetchPresets();
    } catch {}
  };

  const handleLoadPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      onChange({ ...data, ...preset.data });
    }
  };

  const handleDeletePreset = async (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('프리셋을 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/form-presets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: presetId }),
      });
      if (selectedPresetId === presetId) setSelectedPresetId('');
      fetchPresets();
    } catch {}
  };

  return {
    presets,
    selectedPresetId,
    handleSavePreset,
    handleLoadPreset,
    handleDeletePreset,
  };
}
