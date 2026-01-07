/**
 * Blog Automation - Naver Blog API Service
 * 네이버 블로그 XMLRPC API 연동
 */

import { eventBus, EVENT_TYPES } from '../core/events.js';

class NaverBlogService {
  constructor() {
    this.baseUrl = '/api/proxy/naver-blog';
    this.userId = null;
    this.apiPassword = null;
    this.connected = false;
  }

  /**
   * 연결 설정
   */
  setCredentials(userId, apiPassword) {
    this.userId = userId;
    this.apiPassword = apiPassword;
  }

  /**
   * 연결 테스트
   */
  async testConnection() {
    if (!this.userId || !this.apiPassword) {
      throw new Error('네이버 블로그 인증 정보가 설정되지 않았습니다');
    }

    try {
      // 카테고리 목록 조회로 연결 테스트
      const categories = await this.getCategories();
      this.connected = true;
      return { success: true, categories };
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  /**
   * XMLRPC 요청 생성
   */
  buildXmlRpc(methodName, params) {
    const paramXml = params.map(param => {
      if (typeof param === 'string') {
        return `<param><value><string>${this.escapeXml(param)}</string></value></param>`;
      } else if (typeof param === 'number') {
        return `<param><value><int>${param}</int></value></param>`;
      } else if (typeof param === 'boolean') {
        return `<param><value><boolean>${param ? 1 : 0}</boolean></value></param>`;
      } else if (param instanceof Date) {
        return `<param><value><dateTime.iso8601>${param.toISOString()}</dateTime.iso8601></value></param>`;
      } else if (typeof param === 'object') {
        const members = Object.entries(param).map(([key, value]) => {
          let valueXml;
          if (typeof value === 'string') {
            valueXml = `<string>${this.escapeXml(value)}</string>`;
          } else if (typeof value === 'number') {
            valueXml = `<int>${value}</int>`;
          } else if (typeof value === 'boolean') {
            valueXml = `<boolean>${value ? 1 : 0}</boolean>`;
          } else {
            valueXml = `<string>${this.escapeXml(String(value))}</string>`;
          }
          return `<member><name>${key}</name><value>${valueXml}</value></member>`;
        }).join('');
        return `<param><value><struct>${members}</struct></value></param>`;
      }
      return `<param><value><string>${this.escapeXml(String(param))}</string></value></param>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>${methodName}</methodName>
  <params>
    ${paramXml}
  </params>
</methodCall>`;
  }

  /**
   * XML 이스케이프
   */
  escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * XMLRPC 응답 파싱
   */
  parseXmlRpcResponse(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // 에러 체크
    const fault = doc.querySelector('fault');
    if (fault) {
      const faultString = fault.querySelector('member[name="faultString"] string')?.textContent || 'Unknown error';
      throw new Error(`네이버 API 오류: ${faultString}`);
    }

    // 값 추출
    const extractValue = (valueNode) => {
      if (!valueNode) return null;

      const stringNode = valueNode.querySelector('string');
      if (stringNode) return stringNode.textContent;

      const intNode = valueNode.querySelector('int') || valueNode.querySelector('i4');
      if (intNode) return parseInt(intNode.textContent, 10);

      const boolNode = valueNode.querySelector('boolean');
      if (boolNode) return boolNode.textContent === '1';

      const structNode = valueNode.querySelector('struct');
      if (structNode) {
        const result = {};
        structNode.querySelectorAll(':scope > member').forEach(member => {
          const name = member.querySelector('name')?.textContent;
          const val = extractValue(member.querySelector('value'));
          if (name) result[name] = val;
        });
        return result;
      }

      const arrayNode = valueNode.querySelector('array');
      if (arrayNode) {
        return Array.from(arrayNode.querySelectorAll(':scope > data > value')).map(extractValue);
      }

      return valueNode.textContent;
    };

    const params = doc.querySelectorAll('params > param > value');
    if (params.length === 1) {
      return extractValue(params[0]);
    }
    return Array.from(params).map(extractValue);
  }

  /**
   * XMLRPC API 호출
   */
  async callApi(methodName, params) {
    const xml = this.buildXmlRpc(methodName, params);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8'
      },
      body: xml
    });

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`);
    }

    const responseXml = await response.text();
    return this.parseXmlRpcResponse(responseXml);
  }

  /**
   * 카테고리 목록 조회
   */
  async getCategories() {
    const result = await this.callApi('metaWeblog.getCategories', [
      this.userId,
      this.userId,
      this.apiPassword
    ]);

    return Array.isArray(result) ? result : [result];
  }

  /**
   * 글 포스팅
   */
  async postArticle(article) {
    const {
      title,
      content,
      categoryId = '',
      tags = [],
      isPublic = true
    } = article;

    // HTML로 변환 (마크다운에서)
    const htmlContent = this.markdownToHtml(content);

    const postData = {
      title,
      description: htmlContent,
      categories: categoryId ? [categoryId] : [],
      mt_keywords: tags.join(',')
    };

    eventBus.emit(EVENT_TYPES.NAVER_POST_START, { title });

    try {
      const result = await this.callApi('metaWeblog.newPost', [
        this.userId,
        this.userId,
        this.apiPassword,
        postData,
        isPublic
      ]);

      const postUrl = `https://blog.naver.com/${this.userId}/${result}`;

      eventBus.emit(EVENT_TYPES.NAVER_POST_COMPLETE, { postId: result, url: postUrl });

      return {
        success: true,
        postId: result,
        url: postUrl
      };
    } catch (error) {
      eventBus.emit(EVENT_TYPES.NAVER_POST_ERROR, { error: error.message });
      throw error;
    }
  }

  /**
   * 글 수정 (삭제 후 재작성)
   * 네이버 XMLRPC는 수정을 지원하지 않아 삭제 후 재작성
   */
  async updateArticle(postId, article) {
    // 기존 글 삭제
    await this.deleteArticle(postId);

    // 새로 포스팅
    return this.postArticle(article);
  }

  /**
   * 글 삭제
   */
  async deleteArticle(postId) {
    const result = await this.callApi('blogger.deletePost', [
      '',
      postId,
      this.userId,
      this.apiPassword,
      true
    ]);

    return { success: true, deleted: result };
  }

  /**
   * 최근 글 목록 조회
   */
  async getRecentPosts(count = 10) {
    const result = await this.callApi('metaWeblog.getRecentPosts', [
      this.userId,
      this.userId,
      this.apiPassword,
      count
    ]);

    return Array.isArray(result) ? result : [result];
  }

  /**
   * 마크다운을 HTML로 변환 (간단한 변환)
   */
  markdownToHtml(markdown) {
    let html = markdown;

    // 제목
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 굵게, 기울임
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 링크
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // 리스트
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // 번호 리스트
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // 줄바꿈
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // 문단 감싸기
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }

    return html;
  }

  /**
   * 연결 상태 확인
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 연결 해제
   */
  disconnect() {
    this.userId = null;
    this.apiPassword = null;
    this.connected = false;
  }
}

// 싱글톤 인스턴스
const naverBlogService = new NaverBlogService();

export { naverBlogService, NaverBlogService };
