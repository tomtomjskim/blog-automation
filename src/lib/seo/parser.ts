/** 결과 텍스트에서 제목/본문/메타 파싱 (독립 유틸) */
export function parseResult(content: string) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '제목 없음';
  const body = content.replace(/^#\s+.+$/m, '').trim();
  const charCount = content.replace(/[#\s\n]/g, '').length;
  const readTime = Math.ceil(charCount / 500);
  const headings = [...content.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]);

  return { title, body, content, charCount, readTime, headings };
}
