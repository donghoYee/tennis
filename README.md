# 🎾 테니스 토너먼트 관리 시스템

실시간 다중 사용자 테니스 대회 대진표 관리 시스템

## 🚀 Docker로 실행하기

### 사전 준비

#### 필요 사항
- **Docker Desktop** (권장) 또는 **Docker Engine + Docker Compose 플러그인**
- 최소 4GB RAM, 2GB 여유 디스크 공간

#### Docker 설치 확인
```bash
# Docker 버전 확인
docker --version

# Docker Compose 플러그인 확인  
docker compose version

# 정상 응답 예시:
# Docker version 24.0.0+
# Docker Compose version v2.18.0+
```

### 🏃‍♂️ 빠른 시작

#### 1단계: 프로젝트 다운로드
```bash
# Git으로 클론하거나 ZIP 파일 다운로드
git clone https://github.com/donghoYee/tennis_tournament.git
cd tenis_tournament
```

#### 2단계: 시스템 실행
```bash
# 백그라운드에서 전체 시스템 실행
docker compose up -d

# 📝 참고: 최초 실행 시 이미지 빌드로 5-10분 소요될 수 있습니다
```

#### 3단계: 접속 확인
시스템이 준비되면 브라우저에서 다음 URL로 접속하세요:

| 서비스 | URL | 설명 |
|--------|-----|------|
| 🎾 **메인 앱** | http://localhost:8081 | 테니스 토너먼트 관리 시스템 |
| 🔄 **프록시** | http://localhost:8082 | Nginx 리버스 프록시 |
| 🔧 **API** | http://localhost:3001 | 백엔드 REST API |

### 📋 시스템 관리

#### 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker compose ps

# 모든 서비스가 "running" 상태인지 확인
# 백엔드는 "healthy" 상태가 되어야 함
```

#### 로그 모니터링
```bash
# 전체 로그 실시간 확인
docker compose logs -f

# 특정 서비스만 확인
docker compose logs -f backend    # 백엔드 로그
docker compose logs -f frontend   # 프론트엔드 로그
docker compose logs -f nginx      # 프록시 로그

# Ctrl+C로 로그 모니터링 종료
```

#### 시스템 중지
```bash
# 컨테이너 중지 (데이터 보존)
docker compose down

# 완전 삭제 (데이터 포함)
docker compose down -v
```

#### 업데이트 및 재빌드
```bash
# 코드 변경 후 이미지 재빌드
docker compose build

# 재빌드와 함께 재시작
docker compose up -d --build
```

### 🐛 문제 해결

#### 포트 충돌 오류
```bash
# 오류: "port is already allocated"
# 해결: 실행 중인 서비스 확인 후 중지

# 포트 사용 중인 프로세스 확인
sudo lsof -i :8081  # 프론트엔드 포트
sudo lsof -i :3001  # 백엔드 포트
sudo lsof -i :8082  # 프록시 포트

# 필요시 프로세스 종료 후 다시 실행
```

#### 빌드 실패
```bash
# Docker 캐시 정리
docker system prune -f

# 다시 빌드
docker compose build --no-cache
docker compose up -d
```

#### 데이터 초기화
```bash
# 모든 데이터 삭제 후 재시작
docker compose down -v
docker compose up -d
```

## 🛠 개발 환경 실행

### 백엔드 실행
```bash
cd backend
npm install
npm run dev
```

### 프론트엔드 실행
```bash
cd tennis-tournament
npm install
npm run dev
```

## 📊 시스템 구조

```
📦 Tennis Tournament System
├── 🐳 Docker Services
│   ├── 🖥️  Frontend (Port 8081) - React + Vite + Tailwind + Nginx
│   ├── ⚙️  Backend (Port 3001) - Node.js + Express + SQLite
│   └── 🔄 Nginx Proxy (Port 8082) - Load Balancer
├── 💾 Data Persistence
│   └── SQLite Database (Docker Volume: /app/data)
├── 🌐 Real-time Features
│   └── Socket.IO WebSocket Communication
└── 🏗️ Multi-stage Build
    └── Optimized Production Images
```

## 🎯 주요 기능

### ✅ 완성된 기능
- 🏆 **대회 관리**: 생성, 삭제, 진행률 추적
- 👥 **팀 관리**: 팀명 편집, 실시간 동기화
- 🏅 **대진표**: 토너먼트 브래킷, 자동 진출
- 📊 **점수 관리**: 실시간 점수 입력 및 승부 표시
- 📱 **반응형**: 모바일/데스크톱 최적화
- ⚡ **실시간**: Socket.IO 다중 사용자 동기화
- 💾 **데이터 저장**: SQLite 영구 저장
- 🎨 **UI/UX**: Tailwind CSS 현대적 디자인
- 🔄 **로딩**: 부드러운 사용자 경험
- 🌐 **SEO**: 메타데이터, favicon, PWA 지원

## 🌐 접속 포인트

| 서비스 | URL | 설명 |
|--------|-----|------|
| 🎾 **메인 앱** | http://localhost:8081 | 테니스 토너먼트 관리 시스템 |
| 🔄 **프록시** | http://localhost:8082 | Nginx 리버스 프록시 |
| 🔧 **API** | http://localhost:3001 | REST API 서버 |

## 📱 모바일 PWA 지원

- 홈 화면에 앱 추가 가능
- 오프라인 기본 지원 (향후 확장 예정)
- 네이티브 앱 수준의 사용자 경험

## 🔧 기술 스택

### Frontend
- ⚛️ React 18 + TypeScript
- ⚡ Vite (빠른 개발 서버)
- 🎨 Tailwind CSS (유틸리티 기반 스타일링)
- 🔗 Socket.IO Client (실시간 통신)

### Backend
- 🟢 Node.js + Express
- 🗄️ SQLite (경량 데이터베이스)
- 🔄 Socket.IO (실시간 동기화)
- 🌐 CORS (크로스 오리진 지원)

### DevOps
- 🐳 Docker + Docker Compose
- 🔄 Nginx (리버스 프록시)
- 📦 Multi-stage builds (최적화)

## 📈 향후 개선 계획

- [ ] 🔐 사용자 인증 시스템
- [ ] 📊 대회 통계 및 분석
- [ ] 📄 PDF 결과 출력
- [ ] 🎮 다양한 토너먼트 형식
- [ ] 📧 이메일 알림
- [ ] 🏆 순위 시스템

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.
