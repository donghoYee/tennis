#!/bin/bash

echo "🎾 테니스 토너먼트 관리 시스템을 시작합니다..."

# Docker와 Docker Compose 설치 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    echo "https://docs.docker.com/get-docker/ 에서 Docker를 설치해주세요."
    exit 1
fi

# Docker Compose 플러그인 확인
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 플러그인이 설치되어 있지 않습니다."
    echo "최신 Docker Desktop을 설치하거나 Docker Compose 플러그인을 설치해주세요."
    exit 1
fi

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너를 정리합니다..."
docker compose down

# 이미지 빌드 및 컨테이너 실행
echo "🔨 이미지를 빌드하고 컨테이너를 실행합니다..."
docker compose up -d --build

# 상태 확인
echo "⏳ 서비스가 시작될 때까지 기다립니다..."
sleep 10

# 서비스 상태 확인
if docker compose ps | grep -q "running"; then
    echo "✅ 시스템이 성공적으로 시작되었습니다!"
    echo ""
    echo "🌐 접속 정보:"
    echo "   메인 애플리케이션: http://localhost:8081"
    echo "   리버스 프록시:   http://localhost:8082"
    echo "   API 서버:       http://localhost:3001"
    echo ""
    echo "📊 상태 확인: docker compose ps"
    echo "📋 로그 확인: docker compose logs -f"
    echo "🛑 중지하기: docker compose down"
else
    echo "❌ 서비스 시작에 실패했습니다."
    echo "📋 로그를 확인해주세요: docker compose logs"
    exit 1
fi
