# ── 1. Dependências ─────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build ────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Endereço público da API. Variáveis NEXT_PUBLIC_* entram no bundle na hora do build.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Identificação do responsável nos Termos e na Política de privacidade
ARG NEXT_PUBLIC_LEGAL_OPERATOR
ARG NEXT_PUBLIC_LEGAL_DOCUMENT
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_LEGAL_CITY
ENV NEXT_PUBLIC_LEGAL_OPERATOR=$NEXT_PUBLIC_LEGAL_OPERATOR
ENV NEXT_PUBLIC_LEGAL_DOCUMENT=$NEXT_PUBLIC_LEGAL_DOCUMENT
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_LEGAL_CITY=$NEXT_PUBLIC_LEGAL_CITY
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. Execução (só o standalone) ───────────────────────────────
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
