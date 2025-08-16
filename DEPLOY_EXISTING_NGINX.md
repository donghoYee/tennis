# Deploying Tennis Tournament App with Existing Nginx

이 가이드는 이미 nginx가 설치되어 있는 서버에서 tennis tournament 애플리케이션을 배포하는 방법을 설명합니다.

## 전제 조건

- 서버에 nginx가 이미 설치되어 있고 실행 중
- Docker와 Docker Compose가 설치되어 있음
- `cnu-tennis.org` 도메인이 서버 IP를 가리키고 있음
- SSL 인증서가 설정되어 있음 (Let's Encrypt 권장)

## 1. 애플리케이션 배포

기존 nginx 서비스 없이 애플리케이션만 배포합니다:

```bash
# 새로운 compose 파일로 배포
docker compose -f docker-compose.external-nginx.yml up -d

# 또는 기존 서비스 종료 후 새로 시작
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.external-nginx.yml up -d
```

## 2. Nginx 설정

### 2.1 기본 HTTP 설정 (`/etc/nginx/sites-available/cnu-tennis.org`)

```nginx
# HTTP에서 HTTPS로 리다이렉트
server {
    listen 80;
    server_name cnu-tennis.org www.cnu-tennis.org;
    
    # Let's Encrypt 인증을 위한 설정
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

### 2.2 HTTPS 메인 설정

```nginx
# HTTPS 메인 서버
server {
    listen 443 ssl http2;
    server_name cnu-tennis.org www.cnu-tennis.org;

    # SSL 인증서 설정 (Let's Encrypt 경로 예시)
    ssl_certificate /etc/letsencrypt/live/cnu-tennis.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cnu-tennis.org/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    # ssl_stapling on;  # Disabled due to OCSP responder URL warning
    # ssl_stapling_verify on;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # 로그 설정
    access_log /var/log/nginx/cnu-tennis.org.access.log;
    error_log /var/log/nginx/cnu-tennis.org.error.log;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API 요청을 백엔드로 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.IO 연결을 백엔드로 프록시
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 긴 연결을 위한 타임아웃 설정
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # 정적 파일 직접 서빙 (선택사항 - 성능 향상)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:6789;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # 프론트엔드로 모든 기타 요청 프록시
    location / {
        proxy_pass http://127.0.0.1:6789/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SPA 지원을 위한 설정
        proxy_intercept_errors on;
        error_page 404 = @fallback;
    }

    # SPA 폴백 설정 (404 시 index.html 반환)
    location @fallback {
        proxy_pass http://127.0.0.1:6789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 헬스체크 엔드포인트
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## 3. 배포 단계별 가이드

### 3.1 nginx 설정 파일 생성

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/cnu-tennis.org

# 설정 파일 활성화
sudo ln -s /etc/nginx/sites-available/cnu-tennis.org /etc/nginx/sites-enabled/

# nginx 설정 테스트
sudo nginx -t

# nginx 리로드
sudo systemctl reload nginx
```

### 3.2 SSL 인증서 설정 (Let's Encrypt)

```bash
# certbot 설치 (Ubuntu/Debian)
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d cnu-tennis.org -d www.cnu-tennis.org

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

### 3.3 방화벽 설정

```bash
# HTTP, HTTPS 포트 허용
sudo ufw allow 'Nginx Full'

# Docker 애플리케이션 포트는 외부 접근 차단 (nginx만 접근)
sudo ufw deny 5678
sudo ufw deny 6789
```

### 3.4 애플리케이션 배포

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/tennis

# 환경 변수 설정 (.env 파일 생성)
cat > .env << EOF
FRONTEND_URL=https://cnu-tennis.org
BACKEND_URL=https://cnu-tennis.org/api
EOF

# 애플리케이션 배포
docker compose -f docker-compose.external-nginx.yml up -d

# 로그 확인
docker compose -f docker-compose.external-nginx.yml logs -f
```

## 4. 모니터링 및 유지보수

### 4.1 로그 모니터링

```bash
# nginx 로그 확인
sudo tail -f /var/log/nginx/cnu-tennis.org.access.log
sudo tail -f /var/log/nginx/cnu-tennis.org.error.log

# 애플리케이션 로그 확인
docker compose -f docker-compose.external-nginx.yml logs -f backend
docker compose -f docker-compose.external-nginx.yml logs -f frontend
```

### 4.2 서비스 상태 확인

```bash
# nginx 상태 확인
sudo systemctl status nginx

# Docker 컨테이너 상태 확인
docker compose -f docker-compose.external-nginx.yml ps

# 백엔드 직접 접근 테스트
curl -f http://localhost:5678/api/tournaments
curl -v http://localhost:5678/socket.io/

# 프론트엔드 접근 테스트
curl -f http://localhost:6789

# nginx를 통한 접근 테스트
curl -v https://cnu-tennis.org/api/tournaments
curl -v https://cnu-tennis.org/socket.io/
```

### 4.3 디버깅 명령어

```bash
# nginx 설정 테스트
sudo nginx -t

# nginx 에러 로그 실시간 확인
sudo tail -f /var/log/nginx/error.log

# 특정 도메인 access 로그 확인
sudo tail -f /var/log/nginx/cnu-tennis.org.access.log

# 포트 사용 상황 확인
netstat -tlnp | grep -E "(5678|6789|80|443)"

# Docker 컨테이너 로그 확인
docker compose -f docker-compose.external-nginx.yml logs -f backend
docker compose -f docker-compose.external-nginx.yml logs -f frontend
```

## 5. 트러블슈팅

### 5.1 일반적인 문제들

1. **502 Bad Gateway 오류**
   - Docker 컨테이너가 실행 중인지 확인
   - 포트 5678, 6789가 열려있는지 확인
   - nginx 프록시 설정 확인

2. **CORS 오류**
   - backend의 CORS_ORIGIN 환경변수 확인
   - nginx의 프록시 헤더 설정 확인

3. **Socket.IO 연결 오류**
   - **localhost:3001 접속 시도**: 프론트엔드가 `http://localhost:3001`로 연결을 시도한다면 환경변수가 빌드 시 적용되지 않은 것
     - Docker 빌드 시 build args로 환경변수를 전달해야 함 (docker-compose.yml의 `build.args` 확인)
     - `docker compose -f docker-compose.external-nginx.yml up -d --build` 로 강제 재빌드 필요
   - **404 Not Found 오류**: nginx가 요청을 받지만 백엔드로 전달되지 않는 경우
     - `proxy_pass` URL에 trailing slash(/)가 있으면 경로가 잘림 (예: `/api/` → `/`)
     - **해결**: `proxy_pass http://127.0.0.1:5678;` (슬래시 없이) 사용
     - nginx에서 /socket.io/ 경로가 올바른 포트(5678)로 프록시되는지 확인

4. **Nginx 설정 오류**
   - 정규표현식이나 named location(@fallback)에서는 proxy_pass에 URI path를 사용할 수 없음
   - `location ~* \.(js|css)$`나 `location @fallback`에서는 `proxy_pass http://host:port;` (슬래시 없이)
   - **중요**: API와 Socket.IO 경로에서는 경로 보존을 위해 슬래시 없이 사용: `proxy_pass http://127.0.0.1:5678;`

5. **SSL 인증서 오류**
   - certbot 갱신 상태 확인: `sudo certbot certificates`
   - nginx SSL 설정 경로 확인

6. **OCSP Stapling 경고**
   - `ssl_stapling ignored, no OCSP responder URL` 경고가 나타나면 ssl_stapling을 비활성화
   - 이는 보안에 큰 영향을 주지 않는 기능이므로 비활성화해도 무방함
   - Let's Encrypt 인증서를 재발급하면 해결될 수도 있음

### 5.2 단계별 디버깅 가이드

#### Step 1: 컨테이너 상태 확인
```bash
docker compose -f docker-compose.external-nginx.yml ps
# 모든 컨테이너가 Up 상태인지 확인
```

#### Step 2: 백엔드 직접 접근 테스트
```bash
curl -f http://localhost:5678/api/tournaments
curl -v http://localhost:5678/socket.io/
# 백엔드가 정상 응답하는지 확인
```

#### Step 3: nginx 설정 확인
```bash
sudo nginx -t
# 설정 파일에 문법 오류가 없는지 확인
```

#### Step 4: nginx를 통한 접근 테스트
```bash
curl -v https://cnu-tennis.org/api/tournaments
curl -v https://cnu-tennis.org/socket.io/
# nginx가 올바르게 프록시하는지 확인
```

#### Step 5: 프론트엔드 환경변수 확인
```bash
# 브라우저 개발자 도구에서 네트워크 탭 확인
# Socket.IO가 https://cnu-tennis.org/socket.io/로 연결하는지 확인
```

### 5.3 성능 최적화

```bash
# nginx worker 프로세스 수 조정
# /etc/nginx/nginx.conf에서 worker_processes auto; 설정

# 커넥션 수 조정
# events { worker_connections 4096; }

# 캐시 설정 추가
# proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

## 6. 백업 및 복구

### 6.1 데이터 백업

```bash
# Docker 볼륨 백업
docker run --rm -v tennis_backend_data:/data -v $(pwd):/backup alpine tar czf /backup/backend_data_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# nginx 설정 백업
sudo cp -r /etc/nginx/sites-available /backup/nginx_sites_$(date +%Y%m%d_%H%M%S)
```

### 6.2 롤백 절차

```bash
# 이전 버전으로 롤백
docker compose -f docker-compose.external-nginx.yml down
git checkout previous-version
docker compose -f docker-compose.external-nginx.yml up -d
```

이 설정을 통해 `cnu-tennis.org` 도메인에서 안전하고 효율적으로 tennis tournament 애플리케이션을 운영할 수 있습니다.
