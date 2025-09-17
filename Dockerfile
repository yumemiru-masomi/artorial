# ベースイメージ
FROM node:22.19.0-alpine AS base

# 依存関係インストール用ステージ
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package.json package-lock.json ./
RUN npm ci

# ビルド用ステージ
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js のテレメトリを無効化
ENV NEXT_TELEMETRY_DISABLED=1

# ビルド実行
RUN npm run build

# 本番用ステージ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# セキュリティのため非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# publicフォルダとスタンドアロンビルドをコピー
COPY --from=builder /app/public ./public

# .next フォルダのパーミッション設定
RUN mkdir .next
RUN chown nextjs:nodejs .next

# スタンドアロンビルドを使用
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# ポート設定
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.jsサーバーを起動
CMD ["node", "server.js"]