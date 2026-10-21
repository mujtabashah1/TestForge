FROM node:22-alpine AS build
WORKDIR /workspace
COPY package*.json ./
COPY app/backend/package.json app/backend/package.json
COPY app/frontend/package.json app/frontend/package.json
COPY automation/package.json automation/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY app/backend app/backend
RUN npm run db:generate -w @testforge/backend && npm run build -w @testforge/backend
WORKDIR /workspace/app/backend
CMD ["sh","-c","npx prisma migrate deploy && npm run db:seed && node dist/src/server.js"]
