FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY apps/ml-service/package.json ./apps/ml-service/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

FROM deps AS build
COPY . .

RUN npm run build --workspace=packages/shared

# Build a CommonJS copy of the shared package for the backend runtime.
RUN npx tsc -p packages/shared/tsconfig.json \
  --module CommonJS \
  --moduleResolution Node \
  --outDir packages/shared/dist-cjs \
  --declaration true \
  --declarationMap false \
  --sourceMap false \
  --composite false

RUN npm run build --workspace=apps/frontend
RUN npm run build --workspace=apps/backend

FROM node:20-alpine AS backend
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist-cjs ./packages/shared/dist

EXPOSE 5000
CMD ["node", "dist/index.js"]

FROM nginx:alpine AS frontend
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
