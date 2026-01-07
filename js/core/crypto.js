/**
 * Blog Automation - Crypto Module
 * Web Crypto API 기반 AES-GCM 암호화
 */

class SecureStorage {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.iterations = 100000;
    this.storageKey = 'blog_auto_encrypted';
    this.passwordKey = 'blog_auto_pwd_hash';
  }

  /**
   * 브라우저 지원 여부 확인
   */
  isSupported() {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * 비밀번호로부터 암호화 키 파생
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
   */
  async encrypt(data, password) {
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
   */
  async decrypt(encryptedData, password) {
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
   * 비밀번호 해시 생성 (검증용)
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'blog_auto_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
}

// 싱글톤 인스턴스 생성
const secureStorage = new SecureStorage();

export { secureStorage, SecureStorage };
