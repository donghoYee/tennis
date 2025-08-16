# 🚀 실제 서비스 배포 가이드

## 📋 배포 옵션

### 🏠 **옵션 1: 간단한 로컬 테스트**
```bash
# 현재 방식 (개발/테스트용)
docker compose up -d
# 접속: http://localhost:8081
```

### 🌐 **옵션 2: 클라우드 VM 배포** (추천)
```bash
# 서버에서 실행
git clone https://github.com/donghoYee/tennis.git
cd tennis
cp env.example .env
# .env 파일 편집 후
./deploy.sh
```

### 🔒 **옵션 3: 도메인 + HTTPS 적용**
```bash
# SSL 인증서와 함께 배포
docker compose -f docker-compose.prod.yml up -d
```

---

## 🏗️ **서버 준비사항**

### **최소 사양**
- **CPU**: 2 코어
- **RAM**: 4GB 
- **디스크**: 20GB SSD
- **OS**: Ubuntu 22.04 LTS

### **추천 클라우드 서비스**
| 서비스 | 인스턴스 | 월 비용 | 특징 |
|--------|----------|---------|------|
| **AWS EC2** | t3.medium | $30-40 | 안정적, 글로벌 |
| **Google Cloud** | e2-medium | $25-35 | 성능 좋음 |
| **DigitalOcean** | 4GB Droplet | $24 | 간단함 |
| **네이버 클라우드** | Standard-2 | ₩30,000 | 국내 서비스 |
| **카페24** | 클라우드 서버 | ₩25,000 | 한국어 지원 |

---

## 🔧 **단계별 배포 가이드**

### **1단계: 서버 설정**
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 재로그인 또는
newgrp docker

# Git 설치
sudo apt update
sudo apt install -y git
```

### **2단계: 프로젝트 배포**
```bash
# 프로젝트 클론
git clone https://github.com/donghoYee/tennis.git
cd tennis

# 환경설정
cp env.example .env
nano .env  # 도메인과 이메일 설정
```

### **3단계: 도메인 설정** (선택사항)
```bash
# DNS A 레코드 설정
your-domain.com -> 서버 IP
www.your-domain.com -> 서버 IP
api.your-domain.com -> 서버 IP
```

### **4단계: 배포 실행**
```bash
# 간단 배포 (HTTP만)
docker compose up -d

# 또는 HTTPS 배포
./deploy.sh
```

---

## 🔐 **보안 설정**

### **방화벽 설정**
```bash
# UFW 방화벽 활성화
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw status
```

### **SSL 인증서 자동 갱신**
```bash
# Let's Encrypt 자동 갱신 (이미 설정됨)
# 수동 갱신 테스트
docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run
```

### **데이터 백업**
```bash
# 데이터베이스 백업
docker compose exec backend sqlite3 /app/data/tennis_tournament.db ".backup /app/data/backup_$(date +%Y%m%d).db"

# 백업 파일 로컬로 복사
docker cp $(docker compose ps -q backend):/app/data/backup_$(date +%Y%m%d).db ./backup/
```

---

## 📊 **모니터링 & 관리**

### **상태 확인**
```bash
# 컨테이너 상태
docker compose ps

# 로그 확인
docker compose logs -f

# 리소스 사용량
docker stats

# 디스크 사용량
df -h
du -sh ./tennis/
```

### **업데이트 배포**
```bash
# 코드 업데이트
git pull origin main

# 재빌드 & 재시작
docker compose build
docker compose up -d --force-recreate
```

### **문제 해결**
```bash
# 전체 재시작
docker compose down
docker compose up -d

# 캐시 정리
docker system prune -f

# 로그 분석
docker compose logs backend | grep ERROR
docker compose logs nginx | grep error
```

---

## 🚀 **성능 최적화**

### **Docker 최적화**
```bash
# 불필요한 이미지 정리
docker image prune -f

# 메모리 제한 설정 (docker-compose.yml)
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### **Nginx 캐싱**
```nginx
# 정적 파일 캐싱 (이미 설정됨)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **데이터베이스 최적화**
```sql
-- SQLite 최적화 (자동 실행됨)
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

---

## 📈 **스케일링 옵션**

### **수직 스케일링** (서버 업그레이드)
- CPU/RAM 증설
- SSD 용량 확장

### **수평 스케일링** (서버 분리)
```yaml
# 별도 데이터베이스 서버
database:
  image: postgres:15
  environment:
    POSTGRES_DB: tennis_tournament
    POSTGRES_USER: tennis
    POSTGRES_PASSWORD: ${DB_PASSWORD}
```

### **CDN 적용**
- CloudFlare (무료)
- AWS CloudFront
- 네이버 클라우드 CDN

---

## 💰 **예상 운영 비용** (월간)

| 항목 | 비용 | 설명 |
|------|------|------|
| **클라우드 서버** | $25-40 | 4GB RAM, 2 CPU |
| **도메인** | $10-15 | .com 도메인 (연간 $120) |
| **SSL 인증서** | $0 | Let's Encrypt (무료) |
| **백업 스토리지** | $5-10 | 클라우드 백업 |
| **CDN** | $0-20 | CloudFlare (무료/유료) |
| **모니터링** | $0-10 | 기본 모니터링 |
| **총합** | **$40-95** | **월간 운영비** |

---

## 🎯 **배포 후 체크리스트**

- [ ] 🌐 메인 페이지 접속 확인
- [ ] 🔧 API 응답 확인 (`/api/tournaments`)
- [ ] 🔄 Socket.IO 연결 확인
- [ ] 📱 모바일 반응형 확인
- [ ] 🔐 HTTPS 인증서 확인
- [ ] 📊 로그 모니터링 설정
- [ ] 💾 데이터 백업 스케줄 설정
- [ ] 🚨 알림 설정 (서버 다운 시)
- [ ] 📈 성능 모니터링 설정
- [ ] 🔒 보안 스캔 실행

---

## 🆘 **긴급 상황 대응**

### **서비스 다운 시**
```bash
# 즉시 재시작
docker compose restart

# 전체 재배포
docker compose down
docker compose up -d --build
```

### **데이터 손실 시**
```bash
# 백업에서 복구
docker compose down
docker cp ./backup/backup_YYYYMMDD.db $(docker compose ps -q backend):/app/data/tennis_tournament.db
docker compose up -d
```

### **해킹 의심 시**
```bash
# 즉시 중지
docker compose down

# 로그 분석
docker compose logs nginx | grep "suspicious"

# 보안 업데이트
sudo apt update && sudo apt upgrade -y
```

---

## 📞 **지원 & 문의**

배포 과정에서 문제가 발생하면:

1. **로그 확인**: `docker compose logs -f`
2. **이슈 트래킹**: GitHub Issues 등록
3. **커뮤니티**: Docker/Nginx 공식 문서
4. **긴급 상황**: 서버 재시작 → 백업 복구
