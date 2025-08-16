#!/bin/bash

# 🚀 테니스 토너먼트 시스템 배포 스크립트

set -e

echo "🎾 테니스 토너먼트 관리 시스템 배포를 시작합니다..."

# 환경변수 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다. 다음 형식으로 생성해주세요:"
    echo ""
    echo "DOMAIN=your-domain.com"
    echo "EMAIL=your-email@domain.com"
    echo "BACKEND_URL=https://api.your-domain.com"
    echo "FRONTEND_URL=https://your-domain.com"
    echo ""
    exit 1
fi

# .env 파일 로드
source .env

# 필수 변수 확인
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ DOMAIN과 EMAIL 환경변수가 필요합니다."
    exit 1
fi

echo "📧 도메인: $DOMAIN"
echo "📧 이메일: $EMAIL"

# Nginx 설정 파일에서 도메인 업데이트
echo "🔧 Nginx 설정을 업데이트합니다..."
sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.prod.conf

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너를 정리합니다..."
docker compose -f docker-compose.prod.yml down

# 이미지 빌드
echo "🔨 이미지를 빌드합니다..."
docker compose -f docker-compose.prod.yml build

# Let's Encrypt 인증서 발급 (최초 실행 시)
if [ ! -d "./ssl/live/$DOMAIN" ]; then
    echo "🔐 SSL 인증서를 발급합니다..."
    
    # 임시로 HTTP만 실행
    docker compose -f docker-compose.prod.yml up -d nginx
    
    # 인증서 발급
    docker compose -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
    
    # 컨테이너 중지
    docker compose -f docker-compose.prod.yml down
fi

# 전체 시스템 시작
echo "🚀 전체 시스템을 시작합니다..."
docker compose -f docker-compose.prod.yml up -d

# 상태 확인
echo "⏳ 서비스가 시작될 때까지 기다립니다..."
sleep 15

# 헬스체크
echo "🔍 서비스 상태를 확인합니다..."
if docker compose -f docker-compose.prod.yml ps | grep -q "running"; then
    echo "✅ 배포가 성공적으로 완료되었습니다!"
    echo ""
    echo "🌐 접속 정보:"
    echo "   메인 사이트: https://$DOMAIN"
    echo "   API 엔드포인트: https://$DOMAIN/api"
    echo ""
    echo "📊 상태 확인: docker compose -f docker-compose.prod.yml ps"
    echo "📋 로그 확인: docker compose -f docker-compose.prod.yml logs -f"
    echo "🛑 중지하기: docker compose -f docker-compose.prod.yml down"
    echo ""
    echo "🔄 SSL 인증서는 자동으로 갱신됩니다."
else
    echo "❌ 배포에 실패했습니다."
    echo "📋 로그를 확인해주세요: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi
