FROM nginx:alpine

# 필요한 패키지 설치
RUN apk add --no-cache \
    certbot \
    certbot-nginx \
    curl

# Nginx 설정 파일 복사
COPY nginx.prod.conf /etc/nginx/nginx.conf

# SSL 디렉토리 생성
RUN mkdir -p /etc/nginx/ssl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
