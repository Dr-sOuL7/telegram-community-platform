# AI-Powered Telegram Community Intelligence Platform - Final Phase 1 Implementation Plan

This document outlines the foundation and execution plan for Phase 1 of the Telegram Community Intelligence Platform. This final iteration incorporates all advanced architectural paradigms (Idempotency, Dependency Injection, Prisma Transactions, Correlation IDs, API Versioning, and CI/CD).

## User Review Required

> [!IMPORTANT]
> Please review this finalized architecture blueprint. Once approved, we will lock Phase 1 and I will begin the full codebase generation on your Desktop.

## Open Questions

> [!WARNING]
> 1. Testing Framework: Proceeding with **Vitest**.
> 2. Package Manager: Proceeding with **pnpm**.
> Let me know if you want to alter these choices.

---

## Proposed Changes

### 1. Project Initialization & Clean Architecture

We will initialize a Next.js App Router project using TypeScript, strict mode, and Pino.

**Folder Structure (Clean Architecture Enforcement):**
```text
/src
  /app
    /api
      /v1
        /webhook       # Versioned Route Handler (Idempotent)
        /health        # Versioned Health Check endpoint
  /config            # Env variables, Feature Flags, constants
  /db                # Prisma schema, migrations, and Prisma client
  /domain            # Zod validation schemas & Interfaces (e.g., IModerationService)
  /repositories      # DB access layer (Users, Groups, Messages, Events, Moderation)
  /services          # Business logic implementing domain interfaces
  /lib
    /telegram        # Telegram API wrapper, Rate Limiter, Update Dispatcher
    /logger          # Pino structured logging (supports Correlation IDs)
    /errors          # Centralized error handling
  /utils             # Shared utilities
/tests               # Unit and integration tests
/.github
  /workflows         # CI/CD pipeline definition
```

### 2. Database Design (Prisma + Supabase)

#### [NEW] `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------
// ENUMS
// ---------------------------------------------------------

enum ModerationActionType {
  WARN
  UNWARN
  MUTE
  UNMUTE
  BAN
  UNBAN
}

enum EventType {
  USER_JOINED
  USER_LEFT
  MESSAGE_SENT
  COMMAND_EXECUTED
  WARNING_CREATED
  WARNING_REMOVED
  MUTE_APPLIED
  MUTE_REMOVED
  BAN_APPLIED
  BAN_REMOVED
  SPAM_DETECTED
  PROFILE_VIEWED
}

enum Permission {
  WARN
  MUTE
  BAN
  MANAGE_SETTINGS
  VIEW_ANALYTICS
}

enum ReportFrequency {
  DAILY
  WEEKLY
  MONTHLY
}

enum SenderType {
  USER
  BOT
  ADMIN
}

// ---------------------------------------------------------
// MODELS
// ---------------------------------------------------------

model ProcessedUpdate {
  id          String   @id @default(uuid())
  updateId    BigInt   @unique
  processedAt DateTime @default(now())
}

model User {
  id               String             @id @default(uuid())
  telegramId       BigInt             @unique
  username         String?
  firstName        String
  reputation       Int                @default(0)
  warnings         Int                @default(0)
  isActive         Boolean            @default(true)
  joinedAt         DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  deletedAt        DateTime?
  
  groupRoles       GroupRole[]
  messages         Message[]
  moderationEvents ModerationAction[] @relation("Moderator")
  receivedEvents   ModerationAction[] @relation("TargetUser")
  events           EventLog[]
}

model Group {
  id              String             @id @default(uuid())
  telegramGroupId BigInt             @unique
  groupName       String
  isActive        Boolean            @default(true)
  createdAt       DateTime           @default(now())
  deletedAt       DateTime?
  
  roles           GroupRole[]
  settings        GroupSettings?
  messages        Message[]
  moderationLogs  ModerationAction[]
  events          EventLog[]
}

model GroupRole {
  id          String       @id @default(uuid())
  userId      String
  groupId     String
  roleName    String       // e.g., "Junior Mod", "Admin"
  permissions Permission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId, roleName])
}

model GroupSettings {
  id                 String          @id @default(uuid())
  groupId            String          @unique
  antiSpamEnabled    Boolean         @default(true)
  reputationEnabled  Boolean         @default(true)
  welcomeEnabled     Boolean         @default(false)
  reportsEnabled     Boolean         @default(false)
  healthScoreEnabled Boolean         @default(false)
  warnThreshold      Int             @default(3)
  muteThreshold      Int             @default(5)
  reportFrequency    ReportFrequency @default(WEEKLY)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
}

model Message {
  id               String     @id @default(uuid())
  userId           String
  groupId          String
  messageId        BigInt     // Telegram message ID
  replyToMessageId BigInt?
  messageText      String
  isEdited         Boolean    @default(false)
  senderType       SenderType @default(USER)
  createdAt        DateTime   @default(now())

  user  User  @relation(fields: [userId], references: [id])
  group Group @relation(fields: [groupId], references: [id])

  @@index([groupId])
  @@index([userId])
  @@index([createdAt])
}

model ModerationAction {
  id          String               @id @default(uuid())
  userId      String
  groupId     String
  moderatorId String
  actionType  ModerationActionType
  reason      String?
  createdAt   DateTime             @default(now())

  targetUser User  @relation("TargetUser", fields: [userId], references: [id])
  moderator  User  @relation("Moderator", fields: [moderatorId], references: [id])
  group      Group @relation(fields: [groupId], references: [id])

  @@index([groupId, actionType])
  @@index([createdAt])
}

model EventLog {
  id        String    @id @default(uuid())
  groupId   String?
  userId    String?
  eventType EventType
  metadata  Json?
  createdAt DateTime  @default(now())

  group Group? @relation(fields: [groupId], references: [id])
  user  User?  @relation(fields: [userId], references: [id])

  @@index([groupId, eventType])
  @@index([createdAt])
}
```

### 3. Idempotency & Webhook Versioning

#### [NEW] `src/app/api/v1/webhook/route.ts`
- Verifies Telegram secret token.
- Generates a **Correlation ID** (`requestId = crypto.randomUUID()`) passed to the logger.
- Checks `ProcessedUpdate` table. If `update_id` exists, responds `200 OK` immediately.
- Includes Security Headers (`X-App-Version`, `X-Request-ID`) in the response.

### 4. Dependency Injection & Service Interfaces

#### [NEW] `src/domain/interfaces/`
Defines `IModerationService`, `IEventService`, etc. Services implement these interfaces to ensure high testability.

### 5. Prisma Transaction Guidelines

All multi-step state mutations will be executed within `$transaction` blocks.
Example:
```typescript
// Inside ModerationService
await prisma.$transaction([
  prisma.moderationAction.create({ ... }),
  prisma.eventLog.create({ ... }),
  prisma.user.update({ where: { id }, data: { warnings: { increment: 1 } } })
]);
```

### 6. Message Archiving Policy
*Policy defined for Phase 1:* **Raw messages retained indefinitely.**
In a future phase, we may implement a background cron job to archive messages older than 90 days if storage costs require it, but we will preserve everything initially for analytics and ML training.

### 7. CI/CD Requirements

#### [NEW] `.github/workflows/ci.yml`
A GitHub Actions workflow that blocks deployment if it fails:
1. `pnpm install`
2. `pnpm lint` (ESLint strict)
3. `pnpm typecheck` (`tsc --noEmit`)
4. `pnpm test` (Vitest unit and integration suites)
5. `pnpm build` (Next.js production build)

## Verification Plan

### Automated Tests
Run `pnpm test`. The integration tests will explicitly test idempotency by sending duplicate `update_id`s and verifying only one side effect occurs.

### Manual Verification
1. `GET /api/v1/health` returns status with `X-Request-ID` and `X-App-Version` headers.
2. Webhook triggers end-to-end processing with transaction safety verified (either all records insert or none do).
3. CI/CD pipeline triggers green on GitHub push.
