FROM node:22-alpine AS build
WORKDIR /workspace
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package*.json ./
COPY app/backend/package.json app/backend/package.json
COPY app/frontend/package.json app/frontend/package.json
COPY automation/package.json automation/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY app/frontend app/frontend
RUN npm run build -w @testforge/frontend
WORKDIR /workspace/app/frontend
CMD ["npm","start"]
