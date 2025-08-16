#!/bin/bash

echo "🚀 빠른 시작 - 테니스 토너먼트 시스템"
echo ""

# 현재 사용 중인 포트 확인
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 80이 이미 사용 중입니다. 다른 웹서버를 중지하거나 다른 포트를 사용하세요."
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3001이 이미 사용 중입니다."
fi

echo "🐳 Docker Compose로 시스템을 시작합니다..."
docker compose up -d --build

echo ""
echo "⏳ 시스템이 준비될 때까지 잠시 기다려주세요..."
sleep 5

echo ""
echo "🎾 테니스 토너먼트 시스템이 준비되었습니다!"
echo ""
echo "🌐 접속 URL:"
echo "   👉 http://localhost:8081 (메인 앱)"
echo "   👉 http://localhost:8082 (프록시)"
echo ""
echo "💡 유용한 명령어:"
echo "   상태 확인: docker compose ps"
echo "   로그 보기: docker compose logs -f"
echo "   시스템 중지: docker compose down"
echo ""
echo "즐거운 토너먼트 되세요! 🏆"
