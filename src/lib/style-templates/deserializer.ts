import type { StyleId, TemplateData } from '@/lib/types';
import { getStyleTemplate } from './accessors';

/** "[레이블] 값" 형태 문자열을 TemplateData로 역직렬화 */
export function deserializeTemplateData(text: string, style: StyleId): TemplateData {
  if (!text) return {};
  const fields = getStyleTemplate(style);
  const labelToKey = new Map<string, string>();
  for (const f of fields) {
    labelToKey.set(f.label, f.key);
  }

  const result: TemplateData = {};
  const lines = text.split('\n');
  let currentKey: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentKey && currentLines.length > 0) {
      result[currentKey] = currentLines.join('\n').trim();
    }
    currentKey = null;
    currentLines = [];
  };

  for (const line of lines) {
    // 마크다운 표 행 파싱 (food_review 직렬화 포맷)
    const tableMatch = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (tableMatch && tableMatch[1] !== '항목' && tableMatch[1] !== '------') {
      const label = tableMatch[1].trim();
      const value = tableMatch[2].trim();
      const key = labelToKey.get(label);
      if (key) {
        result[key] = key === 'rating' ? value.replace('/5', '') : value;
      }
      continue;
    }

    // "[레이블] 값" 형태 파싱
    const bracketMatch = line.match(/^\[(.+?)\]\s*(.*)/);
    if (bracketMatch) {
      flush();
      const label = bracketMatch[1].trim();
      const value = bracketMatch[2].trim();
      const key = labelToKey.get(label);
      if (key) {
        currentKey = key;
        currentLines = value ? [key === 'rating' ? value.replace('/5', '') : value] : [];
      } else {
        // freeform에 해당하는 경우
        currentKey = 'freeform';
        currentLines = [line];
      }
      continue;
    }

    // 이전 키의 연속 라인이거나 freeform
    if (currentKey) {
      currentLines.push(line);
    } else if (line.trim()) {
      // 매칭되지 않는 라인은 freeform으로
      if (!result['freeform']) result['freeform'] = '';
      result['freeform'] += (result['freeform'] ? '\n' : '') + line;
    }
  }
  flush();

  return result;
}
