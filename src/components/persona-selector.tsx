'use client';

import { Card, CardContent } from '@/components/ui/card';
import { PERSONA_CONFIGS } from '@/lib/personas';
import type { PersonaId } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PersonaSelectorProps {
  value: PersonaId | null;
  onChange: (id: PersonaId | null) => void;
}

export function PersonaSelector({ value, onChange }: PersonaSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">페르소나 (선택)</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {/* 페르소나 없음 옵션 */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:border-primary/50',
            value === null && 'border-primary ring-1 ring-primary',
          )}
          onClick={() => onChange(null)}
        >
          <CardContent className="p-2.5 text-center">
            <div className="text-lg">🎭</div>
            <div className="text-xs font-medium">기본</div>
          </CardContent>
        </Card>
        {PERSONA_CONFIGS.map((persona) => (
          <Card
            key={persona.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              value === persona.id && 'border-primary ring-1 ring-primary',
            )}
            onClick={() => onChange(persona.id)}
          >
            <CardContent className="p-2.5 text-center">
              <div className="text-lg">{persona.icon}</div>
              <div className="text-xs font-medium">{persona.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          {PERSONA_CONFIGS.find(p => p.id === value)?.description}
        </p>
      )}
    </div>
  );
}
