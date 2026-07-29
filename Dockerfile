# ---------------------------------------------------
# Stage 1: Build the NestJS application
# ---------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

# Install native build tools for compiling C++ modules like bcrypt
RUN apk add --no-cache python3 make g++

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Configure pnpm network resilience
RUN pnpm config set fetch-retries 5 \
 && pnpm config set fetch-retry-maxtimeout 120000

# COPY pnpm-workspace.yaml SO PNPM CAN READ allowBuilds
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies cleanly using allowBuilds from pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Copy source files and build
COPY . .
RUN pnpm run build

# Prune devDependencies for production
RUN pnpm prune --prod

# ---------------------------------------------------
# Stage 2: Lightweight Production Container
# ---------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/main.js"]