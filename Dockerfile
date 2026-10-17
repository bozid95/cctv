# ==========================================
# Stage 1: Build the React Vite Frontend
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Server Runner
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for Express server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

# Copy server code and CCTV dataset
COPY server/src ./src

# Copy built frontend assets from client-builder stage
COPY --from=client-builder /app/client/dist /app/client/dist

WORKDIR /app/server

EXPOSE 5000

CMD ["node", "src/server.js"]
