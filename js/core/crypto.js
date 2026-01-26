/**
 * Blog Automation - Crypto Module
 * Web Crypto API 기반 AES-GCM 암호화
 * dev 모드에서는 Base64 인코딩으로 폴백
 */

import { appConfig } from './config.js';

class SecureStorage {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.iterations = 100000;
    this.storageKey = 'blog_auto_encrypted';
    this.passwordKey = 'blog_auto_pwd_hash';
    this._devModeWarningShown = false;
  }

  /**
   * Secure Context 및 Web Crypto API 지원 여부 확인
   */
  isSupported() {
    return appConfig.canUseEncryption();
  }

  /**
   * dev 모드 여부
   */
  isDevMode() {
    return appConfig.isDevMode();
  }

  /**
   * dev 모드 경고 표시 (최초 1회)
   */
  _showDevModeWarning() {
    if (this._devModeWarningShown) return;
    this._devModeWarningShown = true;

    console.warn(
      '⚠️ [보안 경고] HTTP 환경에서는 암호화가 비활성화됩니다.\n' +
      '   API 키가 Base64로만 인코딩되어 저장됩니다.\n' +
      '   HTTPS 환경에서 사용하시면 AES-256 암호화가 적용됩니다.'
    );
  }

  /**
   * 비밀번호로부터 암호화 키 파생 (prod 모드)
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 데이터 암호화
   * dev 모드: Base64 인코딩
   * prod 모드: AES-GCM 암호화
   */
  async encrypt(data, password) {
    // dev 모드: Base64 인코딩으로 폴백
    if (this.isDevMode()) {
      this._showDevModeWarning();
      return this._devModeEncode(data, password);
    }

    // prod 모드: 실제 암호화
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported');
    }

    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
      { name: this.algorithm, iv },
      key,
      encoder.encode(JSON.stringify(data))
    );

    // salt + iv + encrypted data 결합
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * 데이터 복호화
   * dev 모드: Base64 디코딩
   * prod 모드: AES-GCM 복호화
   */
  async decrypt(encryptedData, password) {
    // dev 모드: Base64 디코딩으로 폴백
    if (this.isDevMode()) {
      return this._devModeDecode(encryptedData, password);
    }

    // prod 모드: 실제 복호화
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported');
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const key = await this.deriveKey(password, salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      throw new Error('복호화 실패: 비밀번호가 올바르지 않습니다');
    }
  }

  /**
   * dev 모드 인코딩 (Base64 + 간단한 XOR)
   */
  _devModeEncode(data, password) {
    const jsonStr = JSON.stringify(data);
    const encoded = this._xorEncode(jsonStr, password);
    return 'DEV:' + btoa(encodeURIComponent(encoded));
  }

  /**
   * dev 모드 디코딩
   */
  _devModeDecode(encodedData, password) {
    try {
      // DEV: 접두사 확인
      if (!encodedData.startsWith('DEV:')) {
        // prod 모드에서 저장된 데이터를 dev 모드에서 읽으려는 경우
        throw new Error('이 데이터는 HTTPS 환경에서 암호화되었습니다. HTTPS로 접속해주세요.');
      }

      const base64Data = encodedData.slice(4);
      const decoded = decodeURIComponent(atob(base64Data));
      const jsonStr = this._xorDecode(decoded, password);
      return JSON.parse(jsonStr);
    } catch (error) {
      if (error.message.includes('HTTPS')) {
        throw error;
      }
      throw new Error('복호화 실패: 비밀번호가 올바르지 않습니다');
    }
  }

  /**
   * 간단한 XOR 인코딩 (난독화 목적)
   */
  _xorEncode(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  /**
   * XOR 디코딩
   */
  _xorDecode(str, key) {
    return this._xorEncode(str, key); // XOR은 대칭 연산
  }

  /**
   * 비밀번호 해시 생성 (검증용)
   * dev 모드에서도 동일하게 동작
   */
  async hashPassword(password) {
    if (this.isDevMode()) {
      // dev 모드: 간단한 해시 (보안 수준 낮음)
      return this._simpleHash(password + 'blog_auto_salt');
    }

    // prod 모드: SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'blog_auto_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 간단한 해시 (dev 모드용)
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return 'dev_' + Math.abs(hash).toString(16);
  }

  /**
   * 암호화된 데이터 저장
   */
  async saveSecure(data, password) {
    const encrypted = await this.encrypt(data, password);
    const passwordHash = await this.hashPassword(password);

    localStorage.setItem(this.storageKey, encrypted);
    localStorage.setItem(this.passwordKey, passwordHash);

    return true;
  }

  /**
   * 암호화된 데이터 로드
   */
  async loadSecure(password) {
    const encrypted = localStorage.getItem(this.storageKey);
    if (!encrypted) {
      return null;
    }

    // 비밀번호 검증
    const storedHash = localStorage.getItem(this.passwordKey);
    const inputHash = await this.hashPassword(password);

    if (storedHash && storedHash !== inputHash) {
      throw new Error('비밀번호가 올바르지 않습니다');
    }

    return this.decrypt(encrypted, password);
  }

  /**
   * 저장된 암호화 데이터 존재 여부
   */
  hasStoredData() {
    return !!localStorage.getItem(this.storageKey);
  }

  /**
   * 저장된 데이터가 dev 모드에서 저장되었는지 확인
   */
  isDevModeData() {
    const stored = localStorage.getItem(this.storageKey);
    return stored && stored.startsWith('DEV:');
  }

  /**
   * 암호화 데이터 삭제
   */
  clearSecure() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.passwordKey);
  }

  /**
   * 간단한 난독화 (비암호화 데이터용)
   */
  obfuscate(str) {
    return btoa(encodeURIComponent(str));
  }

  /**
   * 난독화 해제
   */
  deobfuscate(str) {
    try {
      return decodeURIComponent(atob(str));
    } catch {
      return null;
    }
  }

  /**
   * 현재 보안 상태 정보
   */
  getSecurityInfo() {
    return {
      mode: this.isDevMode() ? 'dev' : 'prod',
      encryptionEnabled: !this.isDevMode(),
      algorithm: this.isDevMode() ? 'Base64+XOR (insecure)' : 'AES-GCM-256',
      hasStoredData: this.hasStoredData(),
      isDevModeData: this.isDevModeData()
    };
  }
}

// 싱글톤 인스턴스 생성
const secureStorage = new SecureStorage();

export { secureStorage, SecureStorage };
