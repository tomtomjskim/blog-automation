'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type: 'input' | 'textarea' | 'rating' | 'toggle' | 'select';
  rows?: number;
  group?: string;
  options?: string[];
}

interface CustomStyle {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  systemPrompt: string;
  fields: FieldDef[];
  createdAt: string;
}

const FIELD_TYPES = [
  { value: 'input', label: '텍스트 (한 줄)' },
  { value: 'textarea', label: '텍스트 (여러 줄)' },
  { value: 'rating', label: '별점 (1~5)' },
  { value: 'toggle', label: '토글 (O/X/조건부)' },
  { value: 'select', label: '드롭다운 선택' },
];

const DEFAULT_FIELD: FieldDef = {
  key: '',
  label: '',
  placeholder: '',
  type: 'input',
};

export default function CustomStylesPage() {
  const [styles, setStyles] = useState<CustomStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomStyle | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchStyles = async () => {
    try {
      const res = await fetch('/api/custom-styles');
      const data = await res.json();
      setStyles(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStyles(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('이 커스텀 스타일을 삭제하시겠습니까?')) return;
    await fetch('/api/custom-styles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchStyles();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">커스텀 스타일 관리</h1>
          <p className="text-sm text-muted-foreground">나만의 글쓰기 스타일을 정의하고 관리하세요.</p>
        </div>
        <Button onClick={() => { setCreating(true); setEditing(null); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          새 스타일
        </Button>
      </div>

      {(creating || editing) && (
        <StyleForm
          initial={editing}
          onSave={() => { setCreating(false); setEditing(null); fetchStyles(); }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
      ) : styles.length === 0 && !creating ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 커스텀 스타일이 없습니다. &quot;새 스타일&quot; 버튼으로 시작하세요.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {styles.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-start gap-4 p-4">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{s.name}</div>
                  {s.description && (
                    <div className="text-sm text-muted-foreground">{s.description}</div>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {s.fields.map((f) => (
                      <Badge key={f.key} variant="secondary" className="text-xs">
                        {f.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => { setEditing(s); setCreating(false); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StyleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: CustomStyle | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [icon, setIcon] = useState(initial?.icon || '📝');
  const [description, setDescription] = useState(initial?.description || '');
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt || '');
  const [fields, setFields] = useState<FieldDef[]>(initial?.fields || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addField = () => {
    setFields([...fields, { ...DEFAULT_FIELD, key: `field_${Date.now()}` }]);
  };

  const updateField = (idx: number, patch: Partial<FieldDef>) => {
    setFields(fields.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };

  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('스타일 이름을 입력해주세요.'); return; }
    if (!systemPrompt.trim()) { setError('시스템 프롬프트를 입력해주세요.'); return; }

    // key 자동 생성 (label 기반)
    const processedFields = fields.map((f) => ({
      ...f,
      key: f.key || f.label.replace(/\s+/g, '_').toLowerCase() || `field_${Date.now()}`,
    }));

    setSaving(true);
    setError('');
    try {
      const method = initial ? 'PUT' : 'POST';
      const body = {
        ...(initial ? { id: initial.id } : {}),
        name: name.trim(),
        icon,
        description: description.trim() || null,
        system_prompt: systemPrompt.trim(),
        fields: processedFields,
      };
      const res = await fetch('/api/custom-styles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '저장 실패');
        return;
      }
      onSave();
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{initial ? '스타일 수정' : '새 커스텀 스타일'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">아이콘</label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-16 text-center text-lg"
              maxLength={4}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">스타일 이름</label>
            <Input
              placeholder="예: 여행 리뷰"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">설명 (선택)</label>
          <Input
            placeholder="이 스타일의 간단한 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">시스템 프롬프트</label>
          <Textarea
            placeholder="AI에게 전달할 글쓰기 지침을 입력하세요. 예: 당신은 여행 블로거입니다. 생생한 경험 중심으로 글을 작성해주세요..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">글 생성 시 AI에게 전달되는 역할과 지침입니다.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">입력 필드 정의</label>
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus className="mr-1 h-3 w-3" />
              필드 추가
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">필드를 추가하면 글 생성 폼에 구조화된 입력란이 나타납니다.</p>
          )}

          {fields.map((field, idx) => (
            <div key={idx} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">필드 {idx + 1}</span>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeField(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">라벨</label>
                  <Input
                    placeholder="예: 방문 장소"
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">필드 타입</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={field.type}
                    onChange={(e) => updateField(idx, { type: e.target.value as FieldDef['type'] })}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">플레이스홀더</label>
                <Input
                  placeholder="입력란에 표시될 안내 텍스트"
                  value={field.placeholder}
                  onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                />
              </div>
              {field.type === 'select' && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">선택지 (쉼표 구분)</label>
                  <Input
                    placeholder="예: 좋음, 보통, 나쁨"
                    value={field.options?.join(', ') || ''}
                    onChange={(e) => updateField(idx, {
                      options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })}
                  />
                </div>
              )}
              {field.type === 'textarea' && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">줄 수</label>
                  <Input
                    type="number"
                    min={2}
                    max={10}
                    value={field.rows || 2}
                    onChange={(e) => updateField(idx, { rows: parseInt(e.target.value) || 2 })}
                    className="w-20"
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">그룹명 (선택)</label>
                <Input
                  placeholder="같은 그룹의 필드끼리 묶입니다"
                  value={field.group || ''}
                  onChange={(e) => updateField(idx, { group: e.target.value || undefined })}
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>취소</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : (initial ? '수정' : '생성')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
