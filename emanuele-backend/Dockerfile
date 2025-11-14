# Backend Dockerfile
FROM node:22-alpine
WORKDIR /app

# Installa OpenSSL per generare certificati TLS e tini per gestire i segnali
RUN apk add --no-cache openssl tini

COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Crea la cartella TLS nella path che il server TypeScript usa (/app/src/services/TLS)
# e genera i certificati self-signed lì. In questo modo `ts-node src/server.ts` troverà
# i file sotto /app/src/services/TLS (risolve ENOENT visto nei log).
RUN mkdir -p /app/src/services/TLS && \
    openssl genrsa -out /app/src/services/TLS/server.key 2048 && \
    openssl req -new -x509 -key /app/src/services/TLS/server.key -out /app/src/services/TLS/server.crt -days 365 -subj "/C=IT/ST=State/L=City/O=Organization/CN=localhost"

RUN npx prisma generate --schema=prisma/schema.prisma
ENV DATABASE_URL="file:/app/dev.db"

# Usa tini come init system per gestire correttamente i segnali
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && npm run dev"]
