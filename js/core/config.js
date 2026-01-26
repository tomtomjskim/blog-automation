/**
 * Blog Automation - Configuration Module
 * 환경 설정 및 dev/prod 모드 관리
 */

class AppConfig {
  constructor() {
    this.storageKey = 'blog_auto_config';
    this._config = this._loadConfig();
  }

  /**
   * 기본 설정값
   */
  get defaults() {
    return {
      mode: 'auto',           // 'auto' | 'dev' | 'prod'
      debugMode: false,       // 디버그 로그 활성화
      version: '1.0.0'
    };
  }

  /**
   * Secure Context 여부 확인 (HTTPS 또는 localhost)
   */
  isSecureContext() {
    // 브라우저의 isSecureContext 속성 확인
    if (typeof window !== 'undefined' && 'isSecureContext' in window) {
      return window.isSecureContext;
    }
    
    // 폴백: 프로토콜 기반 확인
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    return (
      protocol === 'https:' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    );
  }

  /**
   * Web Crypto API 지원 여부
   */
  isCryptoSupported() {
    return !!(
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle
    );
  }

  /**
   * 현재 환경 모드 결정
   * @returns {'dev' | 'prod'}
   */
  getEnvironmentMode() {
    const configMode = this._config.mode;
    
    // 수동 설정된 경우
    if (configMode === 'dev') return 'dev';
    if (configMode === 'prod') return 'prod';
    
    // 자동 감지 (기본값)
    // Secure Context가 아니거나 Crypto API가 없으면 dev 모드
    if (!this.isSecureContext() || !this.isCryptoSupported()) {
      return 'dev';
    }
    
    return 'prod';
  }

  /**
   * dev 모드인지 확인
   */
  isDevMode() {
    return this.getEnvironmentMode() === 'dev';
  }

  /**
   * prod 모드인지 확인
   */
  isProdMode() {
    return this.getEnvironmentMode() === 'prod';
  }

  /**
   * 암호화 사용 가능 여부
   */
  canUseEncryption() {
    return this.isSecureContext() && this.isCryptoSupported();
  }

  /**
   * 환경 상태 정보 반환
   */
  getEnvironmentInfo() {
    return {
      mode: this.getEnvironmentMode(),
      configuredMode: this._config.mode,
      isSecureContext: this.isSecureContext(),
      isCryptoSupported: this.isCryptoSupported(),
      canUseEncryption: this.canUseEncryption(),
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port
    };
  }

  /**
   * 모드 수동 설정
   * @param {'auto' | 'dev' | 'prod'} mode
   */
  setMode(mode) {
    if (!['auto', 'dev', 'prod'].includes(mode)) {
      throw new Error('Invalid mode. Use "auto", "dev", or "prod"');
    }
    
    // prod 모드 설정 시 암호화 지원 확인
    if (mode === 'prod' && !this.canUseEncryption()) {
      console.warn('[Config] HTTPS 환경이 아니어서 prod 모드를 사용할 수 없습니다.');
      return false;
    }
    
    this._config.mode = mode;
    this._saveConfig();
    return true;
  }

  /**
   * 디버그 모드 설정
   */
  setDebugMode(enabled) {
    this._config.debugMode = !!enabled;
    this._saveConfig();
  }

  /**
   * 디버그 모드 여부
   */
  isDebugMode() {
    return this._config.debugMode;
  }

  /**
   * 설정 로드
   */
  _loadConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...this.defaults, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[Config] Failed to load config:', e);
    }
    return { ...this.defaults };
  }

  /**
   * 설정 저장
   */
  _saveConfig() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this._config));
    } catch (e) {
      console.warn('[Config] Failed to save config:', e);
    }
  }

  /**
   * 설정 초기화
   */
  reset() {
    this._config = { ...this.defaults };
    localStorage.removeItem(this.storageKey);
  }

  /**
   * 콘솔에 환경 정보 출력 (디버그용)
   */
  logEnvironmentInfo() {
    const info = this.getEnvironmentInfo();
    console.group('🔧 Blog Automation Environment');
    console.log('Mode:', info.mode);
    console.log('Secure Context:', info.isSecureContext);
    console.log('Crypto Supported:', info.isCryptoSupported);
    console.log('Can Use Encryption:', info.canUseEncryption);
    console.log('Protocol:', info.protocol);
    console.log('Host:', `${info.hostname}:${info.port}`);
    console.groupEnd();
  }
}

// 싱글톤 인스턴스
const appConfig = new AppConfig();

// 초기화 시 환경 정보 로깅 (디버그 모드일 때만)
if (appConfig.isDebugMode()) {
  appConfig.logEnvironmentInfo();
}

export { appConfig, AppConfig };
