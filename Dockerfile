# ---------- Build Stage ----------
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (leverages Docker cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build the application
RUN npm run build


# ---------- Production Stage ----------
FROM nginx:stable-alpine AS production

# Copy built app from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (if exists)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
