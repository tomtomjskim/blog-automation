/** 이미지 분석 결과를 프롬프트 텍스트로 변환 */
export function buildImageContextBlock(
  analyses: Array<{ imageIndex: number; description: string; suggestedSection: string; context: string }>,
  imageUrls: string[],
): string {
  if (analyses.length === 0) return '';

  let block = `\n## 첨부 이미지\n아래 이미지들이 첨부되었습니다. 글의 적절한 위치에 마크다운 이미지 태그로 삽입해주세요.\n\n`;

  for (const a of analyses) {
    const url = imageUrls[a.imageIndex] || imageUrls[0];
    block += `- **이미지 ${a.imageIndex + 1}**: ${a.description}\n`;
    block += `  - 마크다운: \`![${a.description}](${url})\`\n`;
    block += `  - 추천 위치: ${a.suggestedSection}\n`;
    block += `  - 맥락: ${a.context}\n\n`;
  }

  block += `**중요**: 위 이미지 마크다운 태그를 글의 적절한 위치에 반드시 포함하세요. URL을 그대로 사용하세요.\n`;

  return block;
}
