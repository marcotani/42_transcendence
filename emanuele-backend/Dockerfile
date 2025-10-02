# Backend Dockerfile
FROM node:22-alpine
WORKDIR /app

# Installa OpenSSL per generare certificati TLS
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Crea la cartella TLS e genera i certificati
RUN mkdir -p /app/services/TLS && \
    openssl genrsa -out /app/services/TLS/server.key 2048 && \
    openssl req -new -x509 -key /app/services/TLS/server.key -out /app/services/TLS/server.crt -days 365 -subj "/C=IT/ST=State/L=City/O=Organization/CN=localhost"

RUN npx prisma generate --schema=prisma/schema.prisma
ENV DATABASE_URL="file:/app/dev.db"
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && npm run dev"]
