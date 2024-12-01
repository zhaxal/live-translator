FROM --platform=linux/amd64 node:18-alpine

# Define build arguments for environment variables
ARG VITE_BACKEND_URL
ARG VITE_WS_BACKEND_URL


# Set environment variables during the build process
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WS_BACKEND_URL=$VITE_WS_BACKEND_URL


WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]