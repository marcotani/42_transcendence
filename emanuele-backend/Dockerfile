# Backend Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY . .
ENV DATABASE_URL="file:/app/dev.db"
CMD ["npm", "run", "dev"]
