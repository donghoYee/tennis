# 테니스 토너먼트 관리 시스템

React + TypeScript + Tailwind CSS로 구현된 테니스 대회 대진표 관리 웹 애플리케이션입니다.

## 주요 기능

### 📊 대시보드
- 진행 중인 대회 목록을 카드 형태로 표시
- 새 대회 생성 버튼
- 대회별 진행률 확인
- 대회 삭제 기능

### 🏆 대회 생성
- 대회 이름 설정
- 참가 팀 수 선택 (2, 4, 8, 16, 32, 64팀)
- 토너먼트 방식 자동 대진표 생성

### 🎾 대진표 관리
- 시각적인 토너먼트 브래킷
- 팀명 실시간 편집
- 경기 점수 입력
- 승부 결과에 따른 자동 진출
- 우승팀 강조 표시

### 📱 반응형 디자인
- 데스크톱과 모바일 모두 최적화
- 터치 친화적인 인터페이스
- 스크롤 가능한 대진표

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Data Storage**: localStorage

## 설치 및 실행

### 필요 사항
- Node.js 18+ (권장: 20+)
- npm 또는 yarn

### 설치
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 접속
개발 서버 실행 후 `http://localhost:5173`에서 애플리케이션을 확인할 수 있습니다.

## 사용법

1. **새 대회 만들기**
   - 대시보드에서 "새 대회 만들기" 버튼 클릭
   - 대회 이름과 참가 팀 수 입력
   - 대회 생성 후 자동으로 대진표 화면으로 이동

2. **팀명 편집**
   - 참가 팀 섹션에서 팀 카드 클릭
   - 새로운 팀명 입력 후 Enter 또는 포커스 해제

3. **경기 진행**
   - 대진표에서 "점수 입력" 버튼 클릭
   - 각 팀의 점수 입력 후 저장
   - 높은 점수를 받은 팀이 자동으로 다음 라운드 진출

4. **대회 관리**
   - 대시보드에서 대회 카드 클릭으로 대회 보기
   - 카드 우상단 휴지통 아이콘으로 대회 삭제

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── Dashboard.tsx
│   ├── CreateTournamentForm.tsx
│   └── TournamentBracket.tsx
├── context/             # React Context
│   └── TournamentContext.tsx
├── types/               # TypeScript 타입 정의
│   └── tournament.ts
├── App.tsx              # 메인 앱 컴포넌트
├── main.tsx             # 앱 진입점
└── index.css            # 전역 스타일
```

## 특징

- **토너먼트 방식**: 단일 토너먼트 방식으로 패배팀은 탈락
- **자동 대진표**: 팀 수에 따라 자동으로 적절한 라운드 구성
- **실시간 업데이트**: 점수 입력 시 즉시 다음 라운드에 반영
- **데이터 영속성**: 브라우저 localStorage에 자동 저장
- **직관적 UI**: 우승팀 하이라이트, 진행률 표시 등

## 향후 개선 사항

- [ ] 대회 설정 편집 기능
- [ ] 경기 일정 관리
- [ ] 선수/팀 상세 정보
- [ ] 대회 결과 인쇄/PDF 출력
- [ ] 여러 대회 형식 지원 (리그전, 더블 엘리미네이션 등)
- [ ] 실시간 동기화 (백엔드 연동)

## 라이선스

MIT License