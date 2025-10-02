# Frontend Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Installa OpenSSL per generare certificati TLS
RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/public ./public

# Genera certificati TLS per il frontend
RUN mkdir -p /app/ssl && \
    openssl genrsa -out /app/ssl/server.key 2048 && \
    openssl req -new -x509 -key /app/ssl/server.key -out /app/ssl/server.crt -days 365 -subj "/C=IT/ST=State/L=City/O=Organization/CN=localhost"

RUN npm install -g http-server
EXPOSE 8080
CMD ["http-server", ".", "-p", "8080", "-S", "-C", "/app/ssl/server.crt", "-K", "/app/ssl/server.key"]
