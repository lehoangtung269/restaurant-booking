# Stage 1: build frontend tĩnh
FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: backend production (serve luôn frontend ở backend/public)
FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend/src ./src
COPY backend/knexfile.js ./
COPY backend/db ./db
COPY --from=frontend /app/frontend/dist ./public
EXPOSE 5000
CMD ["sh", "-c", "npx knex --knexfile knexfile.js migrate:latest && node src/server.js"]
