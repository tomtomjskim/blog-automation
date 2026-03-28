'use client';

import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Preset } from './use-presets';

interface PresetDropdownProps {
  presets: Preset[];
  selectedPresetId: string;
  filledCount: number;
  onLoad: (presetId: string) => void;
  onSave: () => void;
  onDelete: (presetId: string, e: React.MouseEvent) => void;
}

// 프리셋 선택/저장/삭제 UI
export function PresetDropdown({
  presets,
  selectedPresetId,
  filledCount,
  onLoad,
  onSave,
  onDelete,
}: PresetDropdownProps) {
  if (presets.length === 0 && filledCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 pt-2 pb-1">
      <select
        className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
        value={selectedPresetId}
        onChange={(e) => onLoad(e.target.value)}
      >
        <option value="">프리셋 선택...</option>
        {presets.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      {selectedPresetId && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => onDelete(selectedPresetId, e)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      {filledCount > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 text-xs"
          onClick={onSave}
        >
          <Save className="mr-1 h-3 w-3" />
          저장
        </Button>
      )}
    </div>
  );
}
