FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/ml-service/package.json ./apps/ml-service/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=apps/frontend

FROM base AS frontend-build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY . .
RUN npm run build --workspace=apps/frontend

FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=apps/backend
COPY . .
RUN npm run build --workspace=apps/backend

FROM node:20-alpine AS backend
WORKDIR /app
COPY --from=backend-build /app/apps/backend/dist ./dist
COPY --from=backend-build /app/apps/backend/package.json ./
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/packages/shared/dist ./packages/shared/dist
COPY --from=backend-build /app/packages/shared/package.json ./packages/shared/
EXPOSE 5000
CMD ["node", "dist/index.js"]

FROM nginx:alpine AS frontend
COPY --from=frontend-build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
