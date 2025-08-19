#!/bin/bash

# Tennis Tournament Load Testing Script
# 동시 100명 접속 시뮬레이션

set -e

echo "🏓 Tennis Tournament Load Testing Suite"
echo "======================================"
echo ""

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Node.js 및 npm 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되어 있지 않습니다."
    exit 1
fi

# 서버 상태 확인
echo "🔍 서버 상태 확인 중..."
if ! curl -s -f http://localhost:5678/api/tournaments > /dev/null; then
    echo "❌ 서버가 실행되고 있지 않습니다. localhost:5678에서 응답이 없습니다."
    echo "   다음 명령으로 서버를 시작하세요:"
    echo "   cd /home/daniel/Projects/tennis && docker-compose -f docker-compose.external-nginx.yml up -d"
    exit 1
fi
echo "✅ 서버가 정상적으로 실행 중입니다."
echo ""

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install --silent
echo "✅ 의존성 설치 완료"
echo ""

# 시스템 리소스 확인
echo "💻 시스템 리소스 확인"
echo "$(free -h | head -2)"
echo "CPU 코어: $(nproc)"
echo "현재 로드: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

# Docker 컨테이너 상태 확인
echo "🐳 Docker 컨테이너 상태"
echo "$(docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' | head -5)"
echo ""

# 테스트 메뉴
while true; do
    echo "🧪 테스트 선택"
    echo "1) 읽기 테스트 (GET 요청 집중)"
    echo "2) 쓰기 테스트 (POST/PUT 요청 집중)"
    echo "3) Socket.IO 테스트 (실시간 통신)"
    echo "4) 혼합 테스트 (읽기 50% + 쓰기 30% + Socket 20%)"
    echo "5) 전체 테스트 (순차적으로 모든 테스트 실행)"
    echo "6) 시스템 모니터링만 실행"
    echo "0) 종료"
    echo ""
    read -p "선택하세요 (0-6): " choice

    case $choice in
        1)
            echo ""
            echo "🚀 읽기 부하 테스트 시작 (동시 100명, 30초)"
            echo "─────────────────────────────────────────"
            node tests/read-test.js
            ;;
        2)
            echo ""
            echo "🚀 쓰기 부하 테스트 시작 (동시 100명, 30초)"
            echo "─────────────────────────────────────────"
            node tests/write-test.js
            ;;
        3)
            echo ""
            echo "🚀 Socket.IO 부하 테스트 시작 (동시 100명, 30초)"
            echo "─────────────────────────────────────────────"
            node tests/socket-test.js
            ;;
        4)
            echo ""
            echo "🚀 혼합 부하 테스트 시작 (동시 100명, 30초)"
            echo "───────────────────────────────────────"
            node tests/mixed-test.js
            ;;
        5)
            echo ""
            echo "🚀 전체 테스트 수트 실행"
            echo "══════════════════════"
            
            echo ""
            echo "1/4 읽기 테스트..."
            node tests/read-test.js
            
            echo ""
            echo "⏳ 5초 대기 중..."
            sleep 5
            
            echo ""
            echo "2/4 쓰기 테스트..."
            node tests/write-test.js
            
            echo ""
            echo "⏳ 5초 대기 중..."
            sleep 5
            
            echo ""
            echo "3/4 Socket.IO 테스트..."
            node tests/socket-test.js
            
            echo ""
            echo "⏳ 5초 대기 중..."
            sleep 5
            
            echo ""
            echo "4/4 혼합 테스트..."
            node tests/mixed-test.js
            
            echo ""
            echo "🎉 전체 테스트 완료!"
            ;;
        6)
            echo ""
            echo "📊 실시간 시스템 모니터링 (Ctrl+C로 중단)"
            echo "─────────────────────────────────────"
            while true; do
                clear
                echo "🏓 Tennis Tournament - 실시간 모니터링"
                echo "$(date)"
                echo ""
                echo "💻 시스템 리소스:"
                echo "$(free -h | head -2)"
                echo "CPU 로드: $(uptime | awk -F'load average:' '{print $2}')"
                echo ""
                echo "🐳 Docker 컨테이너:"
                echo "$(docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' 2>/dev/null || echo '컨테이너 정보를 가져올 수 없습니다')"
                echo ""
                echo "🌐 서버 응답 테스트:"
                if curl -s -w "응답시간: %{time_total}s\n" -o /dev/null http://localhost:5678/api/tournaments; then
                    echo "✅ 서버 정상"
                else
                    echo "❌ 서버 응답 없음"
                fi
                echo ""
                echo "Ctrl+C로 중단..."
                sleep 2
            done
            ;;
        0)
            echo "테스트를 종료합니다."
            break
            ;;
        *)
            echo "❌ 잘못된 선택입니다. 0-6 사이의 숫자를 입력하세요."
            ;;
    esac
    
    echo ""
    echo "──────────────────────────────────────────────"
    echo ""
done
