/**
 * Blog Automation - Router Module
 * 해시 기반 SPA 라우터
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.currentParams = {};
    this.beforeHooks = [];
    this.afterHooks = [];
    this.notFoundHandler = null;

    // 이벤트 바인딩
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  /**
   * 라우트 등록
   */
  register(path, handler, options = {}) {
    this.routes.set(path, { handler, options });
    return this;
  }

  /**
   * 여러 라우트 한번에 등록
   */
  registerAll(routes) {
    Object.entries(routes).forEach(([path, config]) => {
      if (typeof config === 'function') {
        this.register(path, config);
      } else {
        this.register(path, config.handler, config.options);
      }
    });
    return this;
  }

  /**
   * 404 핸들러 설정
   */
  setNotFound(handler) {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * 라우트 변경 전 훅
   */
  beforeEach(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  /**
   * 라우트 변경 후 훅
   */
  afterEach(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  /**
   * 라우트 이동
   */
  navigate(path, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const hash = queryString ? `${path}?${queryString}` : path;

    if (options.replace) {
      window.location.replace(`#${hash}`);
    } else {
      window.location.hash = hash;
    }
  }

  /**
   * 뒤로 가기
   */
  back() {
    window.history.back();
  }

  /**
   * 현재 라우트 처리
   */
  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const [path, queryString] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryString || ''));

    const prevRoute = this.currentRoute;
    const prevParams = this.currentParams;

    // Before hooks 실행
    for (const hook of this.beforeHooks) {
      const result = await hook({
        to: { path, params },
        from: { path: prevRoute, params: prevParams }
      });

      // false 반환시 네비게이션 취소
      if (result === false) {
        // 이전 해시로 복원
        if (prevRoute) {
          window.history.replaceState(null, '', `#${prevRoute}`);
        }
        return;
      }

      // 다른 경로로 리다이렉트
      if (typeof result === 'string') {
        this.navigate(result, {}, { replace: true });
        return;
      }
    }

    // 라우트 찾기
    const route = this.routes.get(path);

    if (route) {
      this.currentRoute = path;
      this.currentParams = params;

      try {
        await route.handler(params, route.options);
      } catch (error) {
        console.error('Route handler error:', error);
      }
    } else if (this.notFoundHandler) {
      this.notFoundHandler(path, params);
    } else {
      // 기본 404 처리: 홈으로 리다이렉트
      this.navigate('home', {}, { replace: true });
      return;
    }

    // After hooks 실행
    for (const hook of this.afterHooks) {
      await hook({
        to: { path, params },
        from: { path: prevRoute, params: prevParams }
      });
    }
  }

  /**
   * 현재 경로 반환
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * 현재 파라미터 반환
   */
  getCurrentParams() {
    return { ...this.currentParams };
  }

  /**
   * 특정 경로인지 확인
   */
  isRoute(path) {
    return this.currentRoute === path;
  }

  /**
   * 경로 매칭 (패턴 지원)
   */
  matchPath(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  /**
   * 링크 클릭 핸들러 (a 태그용)
   */
  handleLinkClick(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      event.preventDefault();
      const path = href.slice(1);
      this.navigate(path);
    }
  }

  /**
   * 전역 링크 핸들러 설정
   */
  setupLinkHandler() {
    document.addEventListener('click', (e) => this.handleLinkClick(e));
    return this;
  }
}

// 싱글톤 인스턴스
const router = new Router();

export { router, Router };
