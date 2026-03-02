/** 마크다운 → 네이버 에디터 호환 HTML 변환 */
export function markdownToNaverHtml(markdown: string): string {
  let html = markdown;

  // H1 제목
  html = html.replace(/^# (.+)$/gm, '<div style="font-size:28px;font-weight:bold;color:#333;margin-bottom:20px;line-height:1.4;">$1</div>');

  // H2 소제목
  html = html.replace(/^## (.+)$/gm, '<div style="font-size:22px;font-weight:bold;color:#333;margin-top:30px;margin-bottom:15px;padding-bottom:8px;border-bottom:2px solid #00c73c;line-height:1.4;">$1</div>');

  // H3 소소제목
  html = html.replace(/^### (.+)$/gm, '<div style="font-size:18px;font-weight:bold;color:#555;margin-top:20px;margin-bottom:10px;line-height:1.4;">$1</div>');

  // 볼드
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  // 이탤릭
  html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');

  // 이미지
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
    '<div style="text-align:center;margin:20px 0;"><img src="$2" alt="$1" style="max-width:100%;border-radius:8px;" /><div style="font-size:13px;color:#999;margin-top:5px;">$1</div></div>');

  // 링크
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#00c73c;text-decoration:underline;">$1</a>');

  // 순서 없는 리스트
  html = html.replace(/^- (.+)$/gm, '<div style="padding-left:20px;margin:5px 0;line-height:1.8;"><span style="color:#00c73c;margin-right:8px;">●</span>$1</div>');

  // 순서 있는 리스트
  let listCounter = 0;
  html = html.replace(/^\d+\. (.+)$/gm, () => {
    listCounter++;
    return `<div style="padding-left:20px;margin:5px 0;line-height:1.8;"><span style="color:#00c73c;font-weight:bold;margin-right:8px;">${listCounter}.</span>$1</div>`;
  });

  // 인용
  html = html.replace(/^> (.+)$/gm,
    '<div style="border-left:4px solid #00c73c;padding:10px 15px;margin:15px 0;background:#f8f8f8;color:#555;font-style:italic;line-height:1.8;">$1</div>');

  // 표 처리 (간단한 마크다운 표)
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
    const rows = bodyRows.trim().split('\n').map((row: string) =>
      row.split('|').map((c: string) => c.trim()).filter(Boolean)
    );

    let table = '<table style="width:100%;border-collapse:collapse;margin:15px 0;">';
    table += '<tr>';
    for (const h of headers) {
      table += `<th style="border:1px solid #ddd;padding:10px;background:#f5f5f5;font-weight:bold;text-align:center;">${h}</th>`;
    }
    table += '</tr>';
    for (const row of rows) {
      table += '<tr>';
      for (const cell of row) {
        table += `<td style="border:1px solid #ddd;padding:8px;text-align:center;">${cell}</td>`;
      }
      table += '</tr>';
    }
    table += '</table>';
    return table;
  });

  // 수평선
  html = html.replace(/^---$/gm, '<div style="border-top:1px solid #eee;margin:20px 0;"></div>');

  // 코드 인라인
  html = html.replace(/`([^`]+)`/g, '<span style="background:#f4f4f4;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:14px;">$1</span>');

  // 빈 줄 → 문단 간격
  html = html.replace(/\n\n+/g, '<div style="margin:15px 0;"></div>');

  // 남은 줄바꿈
  html = html.replace(/\n/g, '<br/>');

  return html;
}

/** 네이버 전체 문서 래퍼 */
export function wrapNaverDocument(html: string): string {
  return `<div style="max-width:760px;margin:0 auto;font-family:'Noto Sans KR', -apple-system, sans-serif;font-size:16px;line-height:1.8;color:#333;word-break:keep-all;">
${html}
</div>`;
}

/** 복사용 최종 HTML 생성 */
export function convertToNaverHtml(markdown: string): string {
  const innerHtml = markdownToNaverHtml(markdown);
  return wrapNaverDocument(innerHtml);
}
