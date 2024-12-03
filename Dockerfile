# Dockerfile
# Frontend build stage
FROM node:18-alpine AS frontend-builder
ARG VITE_BACKEND_URL
ARG VITE_WS_BACKEND_URL
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Backend build stage
FROM python:3.10 AS backend-builder
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Final stage
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=backend-builder /usr/local/lib/python3.10/site-packages/ /usr/local/lib/python3.10/site-packages/
COPY --from=backend-builder /app/backend /app/backend
COPY --from=frontend-builder /app/frontend/dist /app/frontend

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create required directories
RUN mkdir -p /app/backend/uploads /app/backend/transcripts

EXPOSE 80
CMD ["sh", "-c", "nginx && cd backend && python main.py"]