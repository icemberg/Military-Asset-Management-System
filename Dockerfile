# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache openssl
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate

# Stage 3: Production Image
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy Backend
COPY --from=backend-builder /app/backend ./backend
# Copy Frontend build output to backend public folder
COPY --from=frontend-builder /app/frontend/dist ./backend/public

RUN chown -R node:node /app
USER node

WORKDIR /app/backend

# The Render deployment will need to provide DATABASE_URL and JWT_SECRET
EXPOSE 5000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (node prisma/seed.js || true) && npm start"]
