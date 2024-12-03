FROM node:18-alpine AS builder

ARG VITE_BACKEND_URL
ARG VITE_WS_BACKEND_URL

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WS_BACKEND_URL=$VITE_WS_BACKEND_URL

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]