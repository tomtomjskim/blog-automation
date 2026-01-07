/**
 * Blog Automation - Streaming Feature
 * SSE 스트리밍 지원
 */

import { store, setUIState } from '../state.js';
import { eventBus, EVENT_TYPES } from '../core/events.js';

class StreamingManager {
  constructor() {
    this.enabled = true;
    this.activeStreams = new Map();
    this.outputElement = null;
  }

  /**
   * 스트리밍 활성화 여부 확인
   */
  isEnabled() {
    const settings = store.get('settings');
    return settings?.streaming !== false && this.enabled;
  }

  /**
   * 스트리밍 출력 요소 설정
   */
  setOutputElement(element) {
    this.outputElement = element;
  }

  /**
   * SSE 스트림 처리
   */
  async processStream(response, options = {}) {
    const {
      onChunk = () => {},
      onComplete = () => {},
      onError = () => {},
      streamId = crypto.randomUUID()
    } = options;

    // 스트림 등록
    const controller = new AbortController();
    this.activeStreams.set(streamId, { controller, content: '' });

    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // 남은 버퍼 처리
          if (buffer.trim()) {
            this.processSSELine(buffer, (chunk) => {
              fullContent += chunk;
              onChunk(chunk, fullContent);
              this.updateOutput(fullContent);
            });
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트 파싱
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 마지막 불완전한 라인은 버퍼에 유지

        for (const line of lines) {
          this.processSSELine(line, (chunk) => {
            fullContent += chunk;
            onChunk(chunk, fullContent);
            this.updateOutput(fullContent);
          });
        }
      }

      // 완료
      this.activeStreams.delete(streamId);
      onComplete(fullContent);
      eventBus.emit(EVENT_TYPES.STREAM_COMPLETE, { streamId, content: fullContent });

      return fullContent;
    } catch (error) {
      this.activeStreams.delete(streamId);

      if (error.name === 'AbortError') {
        eventBus.emit(EVENT_TYPES.STREAM_CANCELLED, { streamId });
        return null;
      }

      onError(error);
      eventBus.emit(EVENT_TYPES.STREAM_ERROR, { streamId, error });
      throw error;
    }
  }

  /**
   * SSE 라인 처리
   */
  processSSELine(line, onText) {
    line = line.trim();

    if (!line || line.startsWith(':')) {
      return; // 주석 또는 빈 줄 무시
    }

    if (line.startsWith('data:')) {
      const data = line.slice(5).trim();

      if (data === '[DONE]') {
        return;
      }

      try {
        const json = JSON.parse(data);
        const text = this.extractTextFromSSE(json);
        if (text) {
          onText(text);
        }
      } catch (e) {
        // JSON이 아닌 경우 텍스트로 처리
        if (data) {
          onText(data);
        }
      }
    }
  }

  /**
   * SSE 데이터에서 텍스트 추출
   */
  extractTextFromSSE(json) {
    // Anthropic 형식
    if (json.type === 'content_block_delta' && json.delta?.text) {
      return json.delta.text;
    }

    // OpenAI 형식
    if (json.choices?.[0]?.delta?.content) {
      return json.choices[0].delta.content;
    }

    // Google 형식
    if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
      return json.candidates[0].content.parts[0].text;
    }

    // Groq 형식 (OpenAI 호환)
    if (json.choices?.[0]?.delta?.content) {
      return json.choices[0].delta.content;
    }

    return null;
  }

  /**
   * 출력 요소 업데이트
   */
  updateOutput(content) {
    if (this.outputElement) {
      this.outputElement.textContent = content;

      // 자동 스크롤
      if (this.outputElement.scrollHeight > this.outputElement.clientHeight) {
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
      }
    }

    // 상태 업데이트
    setUIState({ streamingContent: content });
  }

  /**
   * 스트림 취소
   */
  cancelStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.controller.abort();
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * 모든 스트림 취소
   */
  cancelAllStreams() {
    for (const [id, stream] of this.activeStreams) {
      stream.controller.abort();
    }
    this.activeStreams.clear();
  }

  /**
   * 스트리밍 UI 컴포넌트 생성
   */
  createStreamingUI(container) {
    container.innerHTML = `
      <div class="streaming-container">
        <div class="streaming-header">
          <span class="streaming-status">
            <span class="spinner"></span>
            생성 중...
          </span>
          <button class="btn btn-ghost btn-sm streaming-cancel">취소</button>
        </div>
        <div class="streaming-content" id="streaming-output"></div>
        <div class="streaming-footer">
          <span class="streaming-chars">0자</span>
        </div>
      </div>
    `;

    this.outputElement = container.querySelector('#streaming-output');

    // 취소 버튼 이벤트
    container.querySelector('.streaming-cancel')?.addEventListener('click', () => {
      this.cancelAllStreams();
    });

    // 글자 수 업데이트
    const charCounter = container.querySelector('.streaming-chars');
    if (charCounter) {
      store.subscribe('ui', (ui) => {
        if (ui.streamingContent) {
          charCounter.textContent = `${ui.streamingContent.length.toLocaleString()}자`;
        }
      });
    }

    return this.outputElement;
  }

  /**
   * 스트리밍 완료 후 UI 업데이트
   */
  completeStreamingUI(container, content) {
    const header = container.querySelector('.streaming-header');
    if (header) {
      header.innerHTML = `
        <span class="streaming-status complete">
          ✓ 생성 완료
        </span>
      `;
    }
  }
}

// 싱글톤 인스턴스
const streamingManager = new StreamingManager();

export { streamingManager, StreamingManager };
