# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# /api por defecto: nginx hace de proxy hacia la API (mismo origen, sin CORS)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm exec vite build

# ---------- runtime ----------
FROM nginx:1.27-alpine
# Plantillas: la imagen oficial sustituye ${VAR} al arrancar
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV PORT=8080 \
    API_UPSTREAM=http://api:3484 \
    CSP_CONNECT_SRC="'self'"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
