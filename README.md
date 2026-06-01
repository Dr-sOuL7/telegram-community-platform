# AI-Powered Telegram Community Intelligence Platform

## Overview
A production-grade, Next.js App Router-based Telegram backend for managing communities. Built for scale, it handles rate limiting, idempotency, strict dependency injection, and clean architecture patterns to act as a SaaS foundation rather than a simple script bot.

## Architecture Highlights
- **Event-Driven**: All activities log to an `EventLog` table for future analytics.
- **Strict Idempotency**: Webhook processes deduplicate Telegram's `update_id`.
- **Database Safety**: Prisma `$transaction` scopes used for all state mutations.
- **Rate Limiting**: Custom queuing mechanism respects Telegram's API constraints.
- **Correlation IDs**: `X-Request-ID` tracing across API and Pino logs.
- **CI/CD Pipeline**: GitHub Actions strictly enforces linting and typing prior to deployment.

## Tech Stack
- Next.js (App Router)
- TypeScript
- Supabase (PostgreSQL)
- Prisma ORM
- Zod (Validation)
- Pino (Structured Logging)

## Setup Instructions

### 1. Local Environment
Install dependencies:
```bash
npm install
```

Copy the example environment variables:
```bash
cp .env.example .env
```
Ensure you set your `DATABASE_URL` to a valid Postgres database (like Supabase).

### 2. Database
Run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

### 3. Telegram Webhook Setup
Since we use push-based webhooks, Telegram needs a public URL. In development, use `ngrok`:
```bash
ngrok http 3000
```
Then register the webhook with Telegram:
```bash
curl -F "url=https://YOUR_NGROK_URL/api/v1/webhook" \
     -F "secret_token=your_super_secret_webhook_token" \
     https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook
```

### 4. Running the Project
```bash
npm run dev
```

## Deployment (Vercel)
1. Push to GitHub.
2. Import project in Vercel.
3. Add environment variables.
4. Set the Telegram webhook to your production `APP_URL`.
