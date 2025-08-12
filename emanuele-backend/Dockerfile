# Backend Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
ENV DATABASE_URL="file:/app/dev.db"
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && npm run dev"]
