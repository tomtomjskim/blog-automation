# Check Code Command

Blog Automation 프로젝트의 코드 품질과 배포 상태를 확인합니다.

## 체크리스트

### 1. JavaScript 문법 검사
- 모든 JS 파일의 문법 오류 확인
- ES6 모듈 import/export 일관성 검사

### 2. 파일 권한 검사
- 배포 디렉토리 권한 확인 (디렉토리: 755, 파일: 644)
- nginx 접근 가능 여부 확인

### 3. 의존성 검사
- import 경로가 실제 파일과 일치하는지 확인
- 순환 참조 여부 확인

### 4. 배포 상태 검사
- 소스와 배포 디렉토리 동기화 상태 확인
- nginx 컨테이너 내 파일 접근 테스트

## 실행 방법

다음 명령들을 순서대로 실행:

```bash
# 1. JS 문법 검사 (node로 파싱 테스트)
find /home/deploy/projects/blog-automation/js -name "*.js" -exec node --check {} \;

# 2. 파일 권한 검사
find /home/deploy/nginx/www/blog-automation -type d ! -perm 755 -ls
find /home/deploy/nginx/www/blog-automation -type f ! -perm 644 -ls

# 3. Import 경로 검사
grep -r "from '\.\." /home/deploy/projects/blog-automation/js --include="*.js" | head -20

# 4. 소스-배포 동기화 확인
diff -rq /home/deploy/projects/blog-automation/js /home/deploy/nginx/www/blog-automation/js 2>/dev/null | head -10

# 5. nginx 컨테이너 접근 테스트
docker exec nginx-proxy ls -la /var/www/blog-automation/js/ | head -10

# 6. HTTP 접근 테스트
curl -sI http://203.245.30.6:3005/js/app.js | head -5
```

## 자동 수정

권한 문제 발견 시:
```bash
find /home/deploy/nginx/www/blog-automation -type d -exec chmod 755 {} \;
find /home/deploy/nginx/www/blog-automation -type f -exec chmod 644 {} \;
```

동기화 문제 발견 시:
```bash
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  /home/deploy/projects/blog-automation/ \
  /home/deploy/nginx/www/blog-automation/
```
