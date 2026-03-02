# Full Project Refactoring Plan: hire-agent

**Date:** 2026-02-25
**Author:** Architecture Review Agent
**Scope:** Full codebase -- backend, frontend, frontend-admin-dashboard, Docker/infra
**Input:** Architecture review at `./dev/active/architecture-review/architecture-review-code-review.md`

---

## Executive Summary

The hire-agent project is an AI agent marketplace built on NestJS + React with a solid four-layer architecture foundation (Controller, Service, Repository, Entity). The base classes (`BaseController`, `BaseService`, `BaseRepository`, `BaseEntity`) are well-designed, and most modules follow the established patterns correctly.

However, the architecture review identified **5 critical issues**, **9 important improvements**, and **8 minor suggestions**. The most pressing problems are production-safety issues: hardcoded platform fees that make the admin settings UI inert, in-memory rate limiting and typing state that will silently break in multi-container deployments, duplicated webhook logic that has already diverged between services, and direct `process.env` access that bypasses startup validation and introduces a known insecure JWT secret fallback.

This plan organizes all identified issues into **five incremental phases**, ordered by risk and impact. Each phase is designed to maintain full application functionality at every step. The total estimated effort is **12-16 developer-days**, spread across phases that can be executed independently over 4-6 weeks.

**Key outcomes after execution:**
- Platform fee reads from database at runtime (admin settings become functional)
- Rate limiting and typing state survive multi-container deployments via Redis
- Webhook logic is centralized in a single shared service
- All environment variables flow through ConfigService with fail-fast on missing secrets
- OwnersController decomposed from 890 lines / 38 routes into 4 focused controllers
- BaseController pagination uses database-level skip/take instead of loading all rows
- Frontend code duplication reduced by extracting shared HTTP/error handling
- Database indexes added for critical query paths
- Testing foundation established

---

## Current State Analysis

### Module Structure

The backend has 20 modules under `/backend/src/modules/`:

| Module | Has Controller | Has Service | Has Repository | Extends Base Classes | Notes |
|--------|:-------------:|:-----------:|:--------------:|:-------------------:|-------|
| admin | Yes | Yes | No (raw repos) | No | Uses `@InjectRepository` directly |
| agent-memories | Yes | Yes | Yes | Yes | Follows pattern correctly |
| agents | Yes | Yes | Yes | Yes | Follows pattern correctly |
| auth | Yes | Yes | No | No | Legacy user auth; uses DI correctly |
| bot-builder | Yes | Yes | Yes | Yes | Follows pattern correctly |
| bot-monitor | No (admin-only) | Yes | Yes | Yes | Service-only, consumed by AdminController |
| features | Yes | Yes | Yes | Yes | Follows pattern correctly |
| messages | Yes | Yes | Yes | Partial | Service extends BaseService but has in-memory Maps |
| notifications | No | Yes | Yes | Yes | Service-only, no controller |
| orders | No | Yes | Yes | Yes | Routes exposed via OwnersController |
| otp | Yes | Yes | No | No | Legacy module |
| owners | Yes (God Object) | Yes | Yes | Partial | Controller does not extend BaseController |
| portfolios | Yes | Yes | Yes | Yes | Follows pattern correctly |
| reviews | Yes | Yes | Yes | Yes | Follows pattern correctly |
| services | Yes | Yes | Yes | Yes | Follows pattern correctly |
| stripe | Yes | Yes | No | No | Raw repos, direct process.env |
| testimonials | Yes | Yes | Yes | Yes | Follows pattern correctly |
| transactions | Yes | Yes | Yes | Yes | Follows pattern correctly |
| uploads | Yes | N/A | N/A | N/A | Thin upload proxy |
| users | Yes | Yes | Yes | Yes | Legacy user module |

### Base Class Usage

**Base classes defined in** `/backend/src/core/base/`:

- `BaseEntity` -- UUID PK, `createdAt`, `updatedAt`, `deletedAt` (soft delete). Extends TypeORM's `BaseEntity`.
- `BaseRepository` -- `findById`, `findAll`, `findOne`, `create`, `update`, `softDelete`, `delete`, `count`.
- `BaseService` -- `findByIdOrFail`, `findAll`, `create`, `update`, `remove`, `delete`. Injects `BaseRepository`.
- `BaseController` -- CRUD endpoints: `create`, `findAll`, `findOne`, `update`, `remove`. Injects `BaseService`.

**Compliance summary:**
- 13 of 20 modules properly extend all applicable base classes
- `AdminService`, `StripeService` bypass `BaseRepository` with raw `@InjectRepository`
- `OwnersController`, `AdminController` do not extend `BaseController`
- `PlatformSettings` entity does not extend `BaseEntity` (integer PK, no `createdAt`, no soft delete)

### Dependency Injection Patterns

**Correct pattern (majority):** Services inject their own module's repository. Cross-module access uses exported services.

**Violations:**
- `StripeService` injects 4 raw `Repository<>` instances (`Order`, `Transaction`, `Message`, `Agent`) instead of using the established repositories
- `AdminService` injects 6 raw `Repository<>` instances plus `DataSource` for raw SQL
- `OwnersModule.ts` line 25: `JwtModule.register({ secret: process.env.AUTH_JWT_SECRET || 'owner-jwt-secret-dev' })` -- uses `process.env` directly instead of `ConfigService`

### Entity and DTO Structure

**Entities:** All entities except `PlatformSettings` extend `BaseEntity` correctly. The `Order` entity is missing database indexes on `seller_id`, `buyer_owner_id`, and `stripe_payment_intent_id`.

**DTOs:** Most DTOs use `class-validator` decorators properly. The `AdminController` is the primary exception: it uses manual `parseInt` for pagination parameters instead of typed query DTOs with `@IsInt()` / `@Type(() => Number)`.

### API Endpoints and Guards

**Four authentication mechanisms:**
1. **Global JWT Guard** (`JwtAuthGuard`) -- applies to all routes; bypassed with `@Public()` decorator
2. **Owner JWT** (`OwnerAuthGuard`) -- used on owner routes; requires `@Public()` first to bypass global guard
3. **Admin JWT** (`AdminAuthGuard`) -- extends owner JWT with `isAdmin` check
4. **API Key** (`ApiKeyAuthGuard`) -- SHA-256 hash lookup for agent bot authentication

**Fragile pattern:** Routes protected by `@OwnerAuth()` must also be decorated `@Public()` to bypass the global `JwtAuthGuard`. This creates counterintuitive "public but authenticated" routes.

---

## Identified Issues and Opportunities

### Critical (P0) -- Production Safety

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | Hardcoded platform fee `0.15` in 3 services | `orders.service.ts:37`, `stripe.service.ts:43`, `messages.service.ts:1179` | Admin fee changes have zero effect at runtime |
| C2 | In-memory `rateLimitMap` | `messages.service.ts:68-71` | Rate limits don't persist across restarts or containers |
| C3 | In-memory `typingMap` | `messages.service.ts:66-67` | Typing indicators break in multi-container deployment |
| C4 | Duplicated webhook logic | `stripe.service.ts` + `messages.service.ts` | Already diverged; future bug fixes must be applied twice |
| C5 | Direct `process.env` access | `stripe.service.ts`, `owners.module.ts`, `owner-jwt.strategy.ts`, `http-exception.filter.ts`, `logging.interceptor.ts` | Bypasses startup validation; insecure JWT fallback |

### Important (P1) -- Architecture Debt

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| A1 | OwnersController God Object (890 lines, 38 routes, 8 injections) | `owners.controller.ts` | Untestable, merge conflict magnet, violates SRP |
| A2 | BaseController.findAll loads all rows into memory | `base.controller.ts:93-108` | Silent performance degradation at scale |
| A3 | BaseController.count loads all rows | `base.controller.ts:187-189` | Same issue as A2 |
| A4 | AdminService bypasses BaseRepository | `admin.service.ts` | Manual `deletedAt: null as any` workarounds, inconsistent query patterns |
| A5 | StripeService bypasses BaseRepository | `stripe.service.ts` | Two divergent data access paths for same entities |
| A6 | PlatformSettings doesn't extend BaseEntity | `platform-settings.entity.ts` | Integer PK, no createdAt, no soft delete |
| A7 | AdminController manual parseInt | `admin.controller.ts` | Can produce NaN silently; inconsistent with rest of codebase |
| A8 | Refresh token as GET query parameter | `auth.controller.ts:272` | Token appears in server logs, browser history, Referer headers |
| A9 | Frontend httpService 85%+ duplicated | `frontend/` + `frontend-admin-dashboard/` | Bug fixes must be applied twice |

### Minor (P2) -- Maintainability

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | Missing indexes on orders table | `order.entity.ts` | Full table scans as data grows |
| M2 | ThrottlerModule uses in-memory storage | `app.module.ts:59-64` | Same multi-container issue |
| M3 | Hardcoded claim URL to production | `agents.service.ts:37` | Wrong URLs in dev/staging |
| M4 | Swagger title says "NestJS Starter Kit" | `main.ts:79-80` | Unprofessional in API docs |
| M5 | ServeStaticModule serves /test in production | `app.module.ts:50-53` | Test data exposed in production |
| M6 | Frontend Dockerfile uses `npm install --force` | `frontend/Dockerfile:4` | Non-reproducible builds |
| M7 | 25MB generated output not gitignored | `agent-house-bot/generated/` | Repository bloat |
| M8 | Circular dependency risk | `OrdersModule -> StripeModule -> (entities from) OrdersModule` | Fragile import graph |

---

## Proposed Refactoring Plan

### Phase 1: Foundation -- Critical Fixes, Config, and Redis (P0)

**Estimated effort:** 3-4 days
**Risk level:** Medium (touches payment paths)
**Goal:** Fix all 5 critical issues. After this phase, the system is production-safe for multi-container deployment.

#### 1.1 Introduce PlatformSettingsService and Remove Hardcoded Fee

**Files to create:**
- `/backend/src/modules/admin/platform-settings.service.ts`

**Files to modify:**
- `/backend/src/modules/admin/admin.module.ts` -- export the new service
- `/backend/src/modules/orders/orders.service.ts` -- inject and use PlatformSettingsService
- `/backend/src/modules/orders/orders.module.ts` -- import AdminModule
- `/backend/src/modules/stripe/stripe.service.ts` -- inject and use PlatformSettingsService
- `/backend/src/modules/stripe/stripe.module.ts` -- import AdminModule
- `/backend/src/modules/messages/messages.service.ts` -- inject and use PlatformSettingsService
- `/backend/src/modules/messages/messages.module.ts` -- import AdminModule

**Implementation:**

Create a lightweight service that caches the settings with a short TTL to avoid hitting the database on every fee calculation:

```typescript
// /backend/src/modules/admin/platform-settings.service.ts
@Injectable()
export class PlatformSettingsService {
    private cachedSettings: PlatformSettings | null = null;
    private cacheExpiresAt = 0;
    private static readonly CACHE_TTL_MS = 60_000; // 1 minute

    constructor(
        @InjectRepository(PlatformSettings)
        private readonly settingsRepo: Repository<PlatformSettings>,
    ) {}

    async getSettings(): Promise<PlatformSettings> {
        if (this.cachedSettings && Date.now() < this.cacheExpiresAt) {
            return this.cachedSettings;
        }
        let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = await this.settingsRepo.save(this.settingsRepo.create());
        }
        this.cachedSettings = settings;
        this.cacheExpiresAt = Date.now() + PlatformSettingsService.CACHE_TTL_MS;
        return settings;
    }

    async getPlatformFeeRate(): Promise<number> {
        const settings = await this.getSettings();
        return Number(settings.platformFeeRate) / 100; // DB stores 15.0, API needs 0.15
    }

    invalidateCache(): void {
        this.cachedSettings = null;
        this.cacheExpiresAt = 0;
    }
}
```

**Before (in each of the 3 services):**
```typescript
private readonly PLATFORM_FEE_RATE = 0.15;
// ...
const platformFee = Math.round(amount * this.PLATFORM_FEE_RATE * 100) / 100;
```

**After:**
```typescript
constructor(
    // ... existing deps ...
    private readonly platformSettingsService: PlatformSettingsService,
) { /* ... */ }

// In fee calculation methods:
const feeRate = await this.platformSettingsService.getPlatformFeeRate();
const platformFee = Math.round(amount * feeRate * 100) / 100;
```

Call `invalidateCache()` from `AdminService.updateSettings()` when settings are changed.

**Acceptance criteria:**
- Changing `platformFeeRate` in admin panel takes effect within 60 seconds
- All 3 hardcoded `0.15` references are removed
- Unit test verifies fee calculation uses dynamic rate

#### 1.2 Replace In-Memory Rate Limiting with Redis

**Files to create:**
- `/backend/src/infrastructure/redis/redis.module.ts`
- `/backend/src/infrastructure/redis/redis.service.ts`

**Files to modify:**
- `/backend/src/app.module.ts` -- import RedisModule
- `/backend/src/modules/messages/messages.service.ts` -- replace `rateLimitMap`
- `/backend/src/modules/messages/messages.module.ts` -- import RedisModule

**Implementation:**

Install `ioredis`:
```bash
cd backend && npm install ioredis
```

Create a Redis module:
```typescript
// /backend/src/infrastructure/redis/redis.service.ts
@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor(private readonly configService: ConfigService) {
        this.client = new Redis({
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD', undefined),
        });
    }

    /** Increment counter with automatic expiry. Returns new count. */
    async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
        const count = await this.client.incr(key);
        if (count === 1) {
            await this.client.expire(key, ttlSeconds);
        }
        return count;
    }

    /** Set ephemeral value with TTL. Used for typing indicators. */
    async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
        await this.client.set(key, value, 'EX', ttlSeconds);
    }

    /** Check if key exists (typing indicator alive?). */
    async exists(key: string): Promise<boolean> {
        return (await this.client.exists(key)) === 1;
    }

    getClient(): Redis {
        return this.client;
    }
}
```

**Before (MessagesService):**
```typescript
private readonly rateLimitMap = new Map<string, { count: number; resetAt: number }>();

private checkRateLimit(orderId: string, senderId: string): void {
    const key = `${orderId}:${senderId}`;
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);
    if (entry && now < entry.resetAt) {
        if (entry.count >= RATE_LIMIT_MAX) {
            throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count++;
    } else {
        this.rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    }
}
```

**After:**
```typescript
constructor(
    // ... existing deps ...
    private readonly redisService: RedisService,
) { /* ... */ }

private async checkRateLimit(orderId: string, senderId: string): Promise<void> {
    const key = `rate:msg:${orderId}:${senderId}`;
    const count = await this.redisService.incrementWithExpiry(key, 3600); // 1 hour
    if (count > RATE_LIMIT_MAX) {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
}
```

**Note:** `checkRateLimit` becomes `async`. All callers must be updated to `await` it.

**Acceptance criteria:**
- `rateLimitMap` completely removed from MessagesService
- Rate limit state shared across containers (test: send messages from two backends)
- Redis connection uses `REDIS_HOST`/`REDIS_PORT` from environment

#### 1.3 Replace In-Memory Typing State with Redis

**Files to modify:**
- `/backend/src/modules/messages/messages.service.ts` -- replace `typingMap`

**Before:**
```typescript
private readonly typingMap = new Map<string, Map<string, number>>();

recordTyping(orderId: string, key: string): void {
    if (!this.typingMap.has(orderId)) {
        this.typingMap.set(orderId, new Map());
    }
    this.typingMap.get(orderId)!.set(key, Date.now());
}

getTypingStatus(orderId: string, excludeKey: string): { isTyping: boolean } {
    const map = this.typingMap.get(orderId);
    if (!map) return { isTyping: false };
    const now = Date.now();
    for (const [key, ts] of map) {
        if (key !== excludeKey && now - ts < 12000) {
            return { isTyping: true };
        }
    }
    return { isTyping: false };
}
```

**After:**
```typescript
async recordTyping(orderId: string, key: string): Promise<void> {
    await this.redisService.setWithTTL(`typing:${orderId}:${key}`, '1', 12);
}

async getTypingStatus(orderId: string, excludeKey: string): Promise<{ isTyping: boolean }> {
    // Check if any other party is typing (buyer checks seller, seller checks buyer)
    const counterpartKey = excludeKey.startsWith('owner:')
        ? `typing:${orderId}:agent:*`  // buyer checking if agent is typing
        : `typing:${orderId}:owner:*`; // agent checking if owner is typing

    // For simplicity, check the specific known counterpart key
    // The Redis key structure is: typing:{orderId}:{senderKey}
    const isTyping = await this.redisService.exists(
        `typing:${orderId}:${excludeKey === 'buyer' ? 'seller' : 'buyer'}`
    );
    return { isTyping };
}
```

**Note:** The exact key structure should match the existing `recordTypingForOwner` and `recordTypingForAgent` methods. Both `recordTyping*` and `getTypingStatus*` methods become async.

**Acceptance criteria:**
- `typingMap` completely removed from MessagesService
- Typing indicators work across containers
- TTL of 12 seconds means stale indicators auto-expire

#### 1.4 Replace All Direct process.env Access with ConfigService

**Files to modify:**
- `/backend/src/modules/stripe/stripe.service.ts` -- inject ConfigService for Stripe keys
- `/backend/src/modules/owners/owners.module.ts` -- use ConfigService for JWT secret
- `/backend/src/modules/owners/owner-jwt.strategy.ts` -- inject ConfigService, remove fallback
- `/backend/src/core/filters/http-exception.filter.ts` -- inject ConfigService
- `/backend/src/core/interceptors/logging.interceptor.ts` -- inject ConfigService
- `/backend/src/config/env-config.service.ts` -- add Stripe config getters and ensure AUTH_JWT_SECRET

**Before (owner-jwt.strategy.ts):**
```typescript
super({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: process.env.AUTH_JWT_SECRET || 'owner-jwt-secret-dev',
});
```

**After:**
```typescript
constructor(
    private readonly ownersRepository: OwnersRepository,
    private readonly configService: ConfigService,
) {
    const secret = configService.get<string>('AUTH_JWT_SECRET');
    if (!secret) {
        throw new Error('AUTH_JWT_SECRET is required but not set');
    }
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: secret,
    });
}
```

**Before (owners.module.ts):**
```typescript
JwtModule.register({
    secret: process.env.AUTH_JWT_SECRET || 'owner-jwt-secret-dev',
    signOptions: { expiresIn: '1h' },
}),
```

**After:**
```typescript
JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('AUTH_JWT_SECRET');
        if (!secret) {
            throw new Error('AUTH_JWT_SECRET is required but not set');
        }
        return {
            secret,
            signOptions: { expiresIn: '1h' },
        };
    },
    inject: [ConfigService],
}),
```

**Before (stripe.service.ts constructor):**
```typescript
constructor(/* raw repos */) {
    const mode = process.env.STRIPE_MODE || 'test';
    const secretKey = mode === 'live'
        ? (process.env.STRIPE_LIVE_SECRET_KEY ?? '')
        : (process.env.STRIPE_TEST_SECRET_KEY ?? '');
    // ...
}
```

**After:**
```typescript
constructor(
    // ... repos ...
    private readonly configService: ConfigService,
) {
    const mode = this.configService.get<string>('STRIPE_MODE', 'test');
    const secretKey = mode === 'live'
        ? this.configService.getOrThrow<string>('STRIPE_LIVE_SECRET_KEY')
        : this.configService.getOrThrow<string>('STRIPE_TEST_SECRET_KEY');
    // ...
}
```

Add `AUTH_JWT_SECRET` to the `ensureValues` list in `/backend/src/config/env-config.service.ts`.

**Acceptance criteria:**
- Zero `process.env` references in `/backend/src/modules/` and `/backend/src/core/`
- Application crashes on startup if `AUTH_JWT_SECRET` is missing (no silent fallback)
- All Stripe keys read via ConfigService
- `envConfigService.ensureValues()` validates all critical keys

#### 1.5 Extract Shared Webhook Logic into WebhookHelperService

**Files to create:**
- `/backend/src/shared/services/webhook-helper.service.ts`
- `/backend/src/shared/services/webhook-helper.module.ts`

**Files to modify:**
- `/backend/src/modules/stripe/stripe.service.ts` -- remove `INJECTION_PATTERNS`, `sanitizeContent`, `buildWebhookHistory`; inject WebhookHelperService
- `/backend/src/modules/stripe/stripe.module.ts` -- import WebhookHelperModule
- `/backend/src/modules/messages/messages.service.ts` -- remove duplicated patterns; inject WebhookHelperService
- `/backend/src/modules/messages/messages.module.ts` -- import WebhookHelperModule

**Implementation:**

```typescript
// /backend/src/shared/services/webhook-helper.service.ts
@Injectable()
export class WebhookHelperService {
    /** Common LLM injection markers to strip from webhook payloads */
    private static readonly INJECTION_PATTERNS = [
        /<\|system\|>/gi,
        /<\|im_start\|>/gi,
        /<\|im_end\|>/gi,
        /<\|endoftext\|>/gi,
        /\[INST\]/gi,
        /\[\/INST\]/gi,
        /<<SYS>>/gi,
        /<<\/SYS>>/gi,
        /<system>/gi,
        /<\/system>/gi,
    ];

    constructor(
        private readonly messagesRepository: MessagesRepository,
    ) {}

    sanitizeContent(text: string | null): string | null {
        if (!text) return text;
        let sanitized = text;
        for (const pattern of WebhookHelperService.INJECTION_PATTERNS) {
            sanitized = sanitized.replace(pattern, '');
        }
        return sanitized;
    }

    async buildWebhookHistory(
        orderId: string,
    ): Promise<{ senderRole: string; content: string; createdAt: Date }[]> {
        // Unified implementation combining the best of both existing versions
        // ...
    }

    buildSignature(payload: string, secret: string): string {
        return 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
    }

    resolveWebhookUrl(rawUrl: string, configService: ConfigService): string {
        const botBaseUrl = configService.get<string>('HOUSE_BOT_URL');
        if (botBaseUrl && rawUrl.includes('localhost')) {
            return rawUrl.replace(/http:\/\/localhost:\d+/, botBaseUrl);
        }
        return rawUrl;
    }
}
```

**Acceptance criteria:**
- `INJECTION_PATTERNS` array exists in exactly one place
- `sanitizeContent` exists in exactly one place
- `buildWebhookHistory` exists in exactly one place
- Both `StripeService` and `MessagesService` import from `WebhookHelperService`
- Behavior is identical to existing (verified by manual testing of webhook payloads)

---

### Phase 2: Business Logic -- Services, Repositories, Deduplication (P1)

**Estimated effort:** 3-4 days
**Risk level:** Medium
**Goal:** Bring AdminService and StripeService into alignment with the base class architecture. Fix BaseController pagination.

#### 2.1 Fix BaseController.findAll to Use Database Pagination

**Files to modify:**
- `/backend/src/core/base/base.controller.ts`
- `/backend/src/core/base/base.service.ts`
- `/backend/src/core/base/base.repository.ts`

**Add a `findPaginated` method to BaseRepository and BaseService:**

```typescript
// base.repository.ts -- add method
async findPaginated(options?: FindManyOptions<T> & { skip?: number; take?: number }): Promise<[T[], number]> {
    return this.repository.findAndCount({
        ...options,
        relations: options?.relations || this.defaultRelations,
    });
}
```

```typescript
// base.service.ts -- add method
async findPaginated(page: number, limit: number, options?: FindManyOptions<T>): Promise<[T[], number]> {
    const skip = (page - 1) * limit;
    return this.repository.findPaginated({
        ...options,
        skip,
        take: limit,
        relations: options?.relations || this.defaultRelations,
    });
}
```

**Fix BaseController.findAll:**
```typescript
// base.controller.ts -- replace findAll
async findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResponseDto<T>> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const [entities, total] = await this.service.findPaginated(page, limit);
    return new PaginatedResponseDto(
        entities,
        page,
        limit,
        total,
        `${this.service['entityName'] || 'Resources'} retrieved successfully`,
    );
}
```

**Fix BaseController.count:**
```typescript
// base.controller.ts -- replace count
protected async count(): Promise<{ count: number }> {
    const total = await this.service.repository.count();
    return { count: total };
}
```

**Acceptance criteria:**
- `findAll` never loads all rows; uses SQL `LIMIT`/`OFFSET`
- `count` uses `SELECT COUNT(*)` not array length
- All existing controllers that override `findAll` continue to work unchanged

#### 2.2 Migrate StripeService to Use Existing Repositories

**Files to modify:**
- `/backend/src/modules/stripe/stripe.service.ts` -- replace raw repos with module repos
- `/backend/src/modules/stripe/stripe.module.ts` -- import modules instead of entities

**Before:**
```typescript
constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    @InjectRepository(Agent) private readonly agentRepository: Repository<Agent>,
    private readonly notificationsService: NotificationsService,
) { /* ... */ }
```

**After:**
```typescript
constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly messagesRepository: MessagesRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly webhookHelper: WebhookHelperService,
    private readonly platformSettingsService: PlatformSettingsService,
) { /* ... */ }
```

This requires updating `StripeModule` to import `OrdersModule`, `TransactionsModule`, `MessagesModule`, and `AgentsModule` (which export their respective repositories/services).

**Note:** This change depends on resolving the circular dependency risk (M8). If a circular import occurs, use `forwardRef()`:
```typescript
@Module({
    imports: [
        forwardRef(() => OrdersModule),
        // ...
    ],
})
```

**Acceptance criteria:**
- Zero `@InjectRepository` in StripeService
- All entity access goes through typed repositories
- Soft delete filters are automatically applied

#### 2.3 Refactor AdminService to Use Proper Repositories Where Possible

**Rationale:** AdminService legitimately needs cross-entity aggregation queries (stats, revenue, growth). The `QueryBuilder` usage is justified for reporting. However, simple CRUD operations (getSettings, updateSettings, updateAgentStatus) should use proper repositories.

**Files to modify:**
- `/backend/src/modules/admin/admin.service.ts`
- `/backend/src/modules/admin/admin.module.ts`

**Changes:**
1. Extract `getSettings()` and `updateSettings()` into `PlatformSettingsService` (already created in Phase 1.1)
2. Replace `agentRepo.findOne({ where: { id, deletedAt: null as any } })` with `AgentsRepository.findById(id)` -- the base repository already excludes soft-deleted records
3. Keep `QueryBuilder` for stats/reporting methods but use `'a.deletedAt IS NULL'` (TypeORM property name) instead of `'a.deleted_at IS NULL'` for consistency -- TypeORM will map column names
4. Replace raw SQL in `getMonthlyRevenue` with QueryBuilder

**Acceptance criteria:**
- `(deletedAt: null as any)` pattern eliminated from AdminService
- Settings management delegated to PlatformSettingsService
- Simple CRUD uses typed repositories
- Reporting queries remain as QueryBuilder (acceptable)

#### 2.4 Create AdminQueryDto for Paginated Endpoints

**Files to create:**
- `/backend/src/modules/admin/dto/admin-query.dto.ts`

**Files to modify:**
- `/backend/src/modules/admin/admin.controller.ts` -- use typed DTOs

**Before:**
```typescript
@Get('agents')
async listAgents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
```

**After:**
```typescript
// dto/admin-query.dto.ts
export class AdminListAgentsQueryDto extends PaginationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: AgentStatusEnum })
    @IsOptional()
    @IsEnum(AgentStatusEnum)
    status?: AgentStatusEnum;
}

// admin.controller.ts
@Get('agents')
async listAgents(@Query() query: AdminListAgentsQueryDto) {
    const result = await this.adminService.listAgents(
        query.page ?? 1,
        query.limit ?? 50,
        query.search,
        query.status,
    );
```

**Acceptance criteria:**
- Zero manual `parseInt` in AdminController
- Invalid query params (e.g., `?page=abc`) return 400 Bad Request
- Swagger docs show typed query parameters

---

### Phase 3: API Layer -- Controllers, Guards, Interceptors (P1)

**Estimated effort:** 3-4 days
**Risk level:** Medium-High (changes API route organization but not route paths)
**Goal:** Decompose OwnersController. Fix auth pattern. Address minor API issues.

#### 3.1 Decompose OwnersController into Domain-Aligned Controllers

**Current state:** 890 lines, 38 routes, 8 service injections in a single file.

**Proposed decomposition:**

| New Controller | Route Prefix | Endpoints | Services Needed |
|---------------|-------------|-----------|----------------|
| `OwnersController` (auth + profile) | `/v1/owners` | register, login, refresh, me, me/agents, claim, agent video/thumbnail | OwnersService, VideoGenerationService |
| `OwnerOrdersController` | `/v1/owners/me/orders` | list, init, create, get, bot-status, accept, reject, deliver, revision, complete, review | OrdersService, ReviewsService, MessagesService |
| `OwnerMessagesController` | `/v1/owners/me` | messages (list, create, unread, read, typing, payment, question, delivery, testimonial, og-metadata) | MessagesService |
| `OwnerNotificationsController` | `/v1/owners/me/notifications` | list, unread-count, mark-read, mark-all-read | NotificationsService |
| `OwnerPortfoliosController` | `/v1/owners/me` | list portfolios, create, update, delete | PortfoliosService, OwnersService |
| `OwnerServicesController` | `/v1/owners/me/services` | list services | ServicesService |

**Files to create:**
- `/backend/src/modules/owners/controllers/owner-orders.controller.ts`
- `/backend/src/modules/owners/controllers/owner-messages.controller.ts`
- `/backend/src/modules/owners/controllers/owner-notifications.controller.ts`
- `/backend/src/modules/owners/controllers/owner-portfolios.controller.ts`
- `/backend/src/modules/owners/controllers/owner-services.controller.ts`

**Files to modify:**
- `/backend/src/modules/owners/owners.controller.ts` -- reduce to auth + profile only
- `/backend/src/modules/owners/owners.module.ts` -- register new controllers

**Critical:** Route paths must remain identical. The decomposition is structural only -- no API contract changes.

**Example -- OwnerOrdersController:**
```typescript
@ApiTags('Owner Orders')
@Controller({ path: 'owners/me/orders', version: '1' })
export class OwnerOrdersController {
    constructor(
        private readonly ordersService: OrdersService,
        private readonly reviewsService: ReviewsService,
    ) {}

    @Get()
    @Public()
    @OwnerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get orders for all agents owned by the authenticated owner' })
    async getOrders(
        @CurrentOwner() owner: Owner,
        @Query() query: OrderQueryDto,
    ): Promise<PaginatedResponseDto<Order>> {
        // ... moved from OwnersController.getOrders
    }
    // ... remaining order routes
}
```

**Acceptance criteria:**
- All 38 existing routes return identical responses at identical paths
- Each new controller injects at most 2-3 services
- `OwnersController` reduced to ~200 lines (auth + profile + claim)
- No import cycle introduced
- Swagger tags properly separate the endpoint groups

#### 3.2 Fix Refresh Token Security (Legacy Auth Endpoint)

**Files to modify:**
- `/backend/src/modules/auth/auth.controller.ts` -- change from GET + query to POST + body
- `/backend/src/modules/auth/dto/` -- add RefreshTokenDto if not exists

**Before:**
```typescript
@Get('refresh-access-token')
async refreshAccessToken(
    @Query('refreshToken') refreshToken: string,
): Promise<LoginResponsePayloadDto> {
    return await this.authService.refreshAccessToken(refreshToken);
}
```

**After:**
```typescript
@Post('refresh-access-token')
@HttpCode(HttpStatus.OK)
async refreshAccessToken(
    @Body() dto: RefreshTokenDto,
): Promise<LoginResponsePayloadDto> {
    return await this.authService.refreshAccessToken(dto.refreshToken);
}
```

**Breaking change:** Any client using `GET /auth/refresh-access-token?refreshToken=...` must switch to `POST` with body. Check if any frontend code or SDK uses this endpoint.

**Acceptance criteria:**
- Refresh token no longer appears in query strings, server logs, or Referer headers
- Old GET endpoint returns 404 or deprecation warning
- Frontend code updated if it uses this endpoint

#### 3.3 Fix Minor API Issues

**3.3a -- Hardcoded claim URL:**

File: `/backend/src/modules/agents/agents.service.ts`

```typescript
// Before
const claimUrl = `https://hireagent.app/claim/${claimId}`;

// After
const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://hireagent.app');
const claimUrl = `${frontendUrl}/claim/${claimId}`;
```

**3.3b -- Swagger title:**

File: `/backend/src/main.ts`

```typescript
// Before
.setTitle('NestJS Starter Kit')
.setDescription('NestJS Starter Kit API Documentation')

// After
.setTitle('HireAgent API')
.setDescription('HireAgent - AI Agent Marketplace API Documentation')
```

And change `customSiteTitle`:
```typescript
customSiteTitle: 'HireAgent API',
```

**3.3c -- Remove ServeStaticModule /test path in production:**

File: `/backend/src/app.module.ts`

Remove the test ServeStaticModule registration entirely, or conditionally register based on environment:
```typescript
// Remove this entirely:
ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'src', 'test'),
    serveRoot: '/test',
}),
```

Fix the icons path to use dist-relative path:
```typescript
ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', '..', 'assets', 'icons'),
    serveRoot: '/diagnosis-icons',
}),
```
And copy assets at build time via Dockerfile.

**3.3d -- Configure ThrottlerModule with Redis storage:**

File: `/backend/src/app.module.ts`

```typescript
// Before
ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),

// After
ThrottlerModule.forRootAsync({
    imports: [RedisModule],
    useFactory: (redisService: RedisService) => ({
        throttlers: [{ ttl: 60000, limit: 10 }],
        storage: new ThrottlerStorageRedisService(redisService.getClient()),
    }),
    inject: [RedisService],
}),
```

Install: `npm install @nestjs/throttler-storage-redis`

**Acceptance criteria for all 3.3 items:**
- Claim URLs use environment-configured frontend domain
- Swagger shows "HireAgent API" title
- `/test` not served in production
- ThrottlerModule backed by Redis

---

### Phase 4: Frontend -- Shared Packages, Code Deduplication (P1/P2)

**Estimated effort:** 2-3 days
**Risk level:** Low-Medium
**Goal:** Extract duplicated frontend code. Fix Docker build issues.

#### 4.1 Extract Shared Frontend Code into a Common Package

**Option A (Recommended): Create `packages/frontend-common/` workspace package**

Create a shared workspace package that both frontends import:

```
hire-agent/
  packages/
    frontend-common/
      src/
        services/
          httpService.ts      # Base HttpService class
        utils/
          errorHandler.ts     # Shared error handling
        types/
          httpService.ts      # Shared API types
      package.json
      tsconfig.json
```

**Root `package.json` (add workspaces):**
```json
{
  "workspaces": [
    "frontend",
    "frontend-admin-dashboard",
    "packages/*"
  ]
}
```

**Base HttpService in shared package:**
```typescript
// packages/frontend-common/src/services/httpService.ts
export class BaseHttpService {
    protected api: AxiosInstance;

    constructor(config: { baseURL: string; tokenKey: string }) {
        this.api = axios.create({
            baseURL: config.baseURL,
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });
        this.setupRequestInterceptor(config.tokenKey);
    }

    protected setupRequestInterceptor(tokenKey: string) {
        this.api.interceptors.request.use((config) => {
            const token = localStorage.getItem(tokenKey);
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // All shared methods: get, post, put, delete, getPaginated, getFullResponse
    // ...
}
```

**Frontend-specific extension:**
```typescript
// frontend/app/services/httpService.ts
import { BaseHttpService } from '@hire-agent/frontend-common';

class HttpService extends BaseHttpService {
    private isRefreshing = false;
    private refreshQueue: Array<(token: string) => void> = [];

    constructor() {
        super({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
            tokenKey: 'token',
        });
        this.setupRefreshInterceptor();
    }

    // JWT refresh logic (frontend-specific)
    // postFormData, getBlob, patch (frontend-specific)
}
```

**Admin-specific extension:**
```typescript
// frontend-admin-dashboard/app/services/httpService.ts
import { BaseHttpService } from '@hire-agent/frontend-common';

class HttpService extends BaseHttpService {
    constructor() {
        super({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
            tokenKey: 'adminToken',
        });
        this.setupErrorInterceptor();
    }
}
```

**Acceptance criteria:**
- Shared code exists in exactly one location
- Both frontends compile and run correctly
- Bug fixes to shared methods need only one change

#### 4.2 Fix Frontend Dockerfile

**File:** `/frontend/Dockerfile`

```dockerfile
# Before
RUN npm install --force

# After
COPY package-lock.json ./
RUN npm ci
```

Similarly for the admin dashboard.

**Acceptance criteria:**
- Reproducible builds using lockfile
- No `--force` flag

#### 4.3 Add Generated Output to .gitignore

**File:** `/.gitignore`

Add:
```
# Generated bot output
agent-house-bot/generated/
```

Remove existing tracked files:
```bash
git rm -r --cached agent-house-bot/generated/
```

**Acceptance criteria:**
- `agent-house-bot/generated/` no longer tracked
- Repository size reduced by ~25MB

---

### Phase 5: Testing and Documentation (P2)

**Estimated effort:** 3-5 days
**Risk level:** Low
**Goal:** Establish testing foundation and document architecture decisions.

#### 5.1 Establish Testing Infrastructure

**Current state:** No tests exist beyond the default NestJS boilerplate `app.controller.spec.ts`.

**Priority test targets (highest ROI first):**

1. **PlatformSettingsService** -- verify caching, invalidation, fee rate conversion
2. **WebhookHelperService** -- verify sanitization, history building, signature generation
3. **OrdersService** -- verify fee calculation uses PlatformSettingsService, order lifecycle
4. **MessagesService** -- verify rate limiting via Redis, typing via Redis
5. **StripeService** -- verify webhook handling, payment request flow

**Test file locations:**
- `/backend/src/modules/admin/platform-settings.service.spec.ts`
- `/backend/src/shared/services/webhook-helper.service.spec.ts`
- `/backend/src/modules/orders/orders.service.spec.ts`
- `/backend/src/modules/messages/messages.service.spec.ts`
- `/backend/src/modules/stripe/stripe.service.spec.ts`

**Example test -- PlatformSettingsService:**
```typescript
describe('PlatformSettingsService', () => {
    let service: PlatformSettingsService;
    let repo: MockType<Repository<PlatformSettings>>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                PlatformSettingsService,
                {
                    provide: getRepositoryToken(PlatformSettings),
                    useFactory: repositoryMockFactory,
                },
            ],
        }).compile();
        service = module.get(PlatformSettingsService);
        repo = module.get(getRepositoryToken(PlatformSettings));
    });

    it('should return fee rate from database', async () => {
        repo.findOne.mockResolvedValue({ id: 1, platformFeeRate: 15.0 });
        const rate = await service.getPlatformFeeRate();
        expect(rate).toBe(0.15);
    });

    it('should cache settings and not hit DB on second call', async () => {
        repo.findOne.mockResolvedValue({ id: 1, platformFeeRate: 15.0 });
        await service.getSettings();
        await service.getSettings();
        expect(repo.findOne).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache and re-fetch from DB', async () => {
        repo.findOne.mockResolvedValue({ id: 1, platformFeeRate: 15.0 });
        await service.getSettings();
        service.invalidateCache();
        repo.findOne.mockResolvedValue({ id: 1, platformFeeRate: 20.0 });
        const rate = await service.getPlatformFeeRate();
        expect(rate).toBe(0.20);
    });
});
```

**E2E test targets:**
- `/backend/test/owners-orders.e2e-spec.ts` -- full order lifecycle via owner endpoints
- `/backend/test/webhook.e2e-spec.ts` -- Stripe webhook handling with mock events

**Acceptance criteria:**
- At least 5 service-level unit test files covering the refactored components
- At least 1 E2E test covering the order lifecycle
- Tests run in CI (update `.github/workflows/ci.yml`)

#### 5.2 Update Swagger and Documentation

- Update all `@ApiTags` on new controllers
- Add `@ApiProperty` decorators to any DTOs missing them (especially admin DTOs)
- Document the auth guard pattern: why `@Public()` + `@OwnerAuth()` is needed
- Update `PROJECT_KNOWLEDGE.md` with new module structure after controller decomposition

---

## Database Migration Plan

### Required Migrations

#### Migration 1: Add Indexes to Orders Table

```typescript
// YYYYMMDDHHMMSS-AddOrderIndexes.ts
export class AddOrderIndexes implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex('orders', new TableIndex({
            name: 'IDX_orders_seller_id',
            columnNames: ['seller_id'],
        }));
        await queryRunner.createIndex('orders', new TableIndex({
            name: 'IDX_orders_buyer_owner_id',
            columnNames: ['buyer_owner_id'],
        }));
        await queryRunner.createIndex('orders', new TableIndex({
            name: 'IDX_orders_stripe_payment_intent_id',
            columnNames: ['stripe_payment_intent_id'],
            isUnique: true,
            where: 'stripe_payment_intent_id IS NOT NULL',
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('orders', 'IDX_orders_stripe_payment_intent_id');
        await queryRunner.dropIndex('orders', 'IDX_orders_buyer_owner_id');
        await queryRunner.dropIndex('orders', 'IDX_orders_seller_id');
    }
}
```

#### Migration 2: Add Indexes to Messages Table

```typescript
export class AddMessageIndexes implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createIndex('messages', new TableIndex({
            name: 'IDX_messages_order_id',
            columnNames: ['order_id'],
        }));
        await queryRunner.createIndex('messages', new TableIndex({
            name: 'IDX_messages_created_at',
            columnNames: ['created_at'],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex('messages', 'IDX_messages_created_at');
        await queryRunner.dropIndex('messages', 'IDX_messages_order_id');
    }
}
```

### No Entity Schema Changes Required

The `PlatformSettings` entity does not need to change to `BaseEntity`. The integer PK is acceptable for a singleton configuration record. The inconsistency is documented as a known exception.

### Data Migration

No data migrations are required. All changes are additive (indexes) or code-only (service refactoring).

---

## Risk Assessment and Mitigation

### High Risk

| Risk | Phase | Mitigation |
|------|-------|------------|
| Platform fee change breaks payment calculations | 1.1 | Verify fee math with unit tests before and after. Test with existing `platformFeeRate` of 15.0 (stored in DB). Ensure division by 100 is correct. |
| Redis unavailability causes message sending failures | 1.2-1.3 | Add Redis health check at startup. Implement graceful fallback (log warning, skip rate limit) if Redis is temporarily unavailable. |
| OwnersController decomposition changes route paths | 3.1 | Write E2E tests for all 38 routes BEFORE decomposition. Run after to verify identical behavior. Use explicit `@Controller({ path: 'owners/me/orders' })` not relative paths. |
| Circular dependency when StripeModule imports OrdersModule | 2.2 | Use `forwardRef()` if needed. Test module resolution during compilation. |

### Medium Risk

| Risk | Phase | Mitigation |
|------|-------|------------|
| `checkRateLimit` becoming async breaks callers | 1.2 | Search all callers and update to `await`. TypeScript compiler will catch most issues. |
| Typing methods becoming async breaks callers | 1.3 | Same approach. `recordTyping*` and `getTypingStatus*` callers must await. |
| Frontend workspace setup breaks build | 4.1 | Test build locally before merging. Keep old files as backup until new setup is verified. |
| Admin QueryBuilder queries break with column name changes | 2.3 | Test each query individually. TypeORM maps property names to column names in `.where()` but not in raw `.andWhere('t.deleted_at IS NULL')`. Keep raw SQL column names in QueryBuilder string conditions. |

### Low Risk

| Risk | Phase | Mitigation |
|------|-------|------------|
| Swagger title change | 3.3b | No functional impact |
| .gitignore change | 4.3 | Only affects tracked file history |
| Index creation on large tables | Migration 1-2 | Use `CREATE INDEX CONCURRENTLY` in production. Standard `CREATE INDEX` is fine for small tables. |

### Rollback Strategy

Each phase is independently deployable and reversible:

- **Phase 1:** Revert to hardcoded fee rate and in-memory Maps by reverting commits. No schema changes.
- **Phase 2:** Base class additions are backward-compatible. Existing controllers that override `findAll` are unaffected.
- **Phase 3:** Controller decomposition preserves route paths. Revert = merge controllers back into one file.
- **Phase 4:** Frontend package extraction can be reverted by copying shared code back into each app.
- **Phase 5:** Tests are additive. Removing tests has no production impact.

---

## Testing Strategy

### Unit Tests

| Component | Test File | Key Assertions |
|-----------|-----------|---------------|
| PlatformSettingsService | `platform-settings.service.spec.ts` | Fee rate reads from DB, caching works, invalidation works |
| WebhookHelperService | `webhook-helper.service.spec.ts` | Sanitization strips all patterns, signature matches expected HMAC, history serialization correct |
| OrdersService | `orders.service.spec.ts` | Fee uses dynamic rate, order lifecycle transitions correct |
| MessagesService | `messages.service.spec.ts` | Rate limit uses Redis, typing uses Redis, webhook fires correctly |
| StripeService | `stripe.service.spec.ts` | Webhook parsing, payment succeeded/failed handling, uses repositories |
| RedisService | `redis.service.spec.ts` | incrementWithExpiry, setWithTTL, exists |
| BaseController | `base.controller.spec.ts` | findAll uses database pagination, count uses SQL count |

### E2E Tests

| Flow | Test File | Endpoints Covered |
|------|-----------|-------------------|
| Order lifecycle | `owners-orders.e2e-spec.ts` | init-order -> accept -> deliver -> complete |
| Stripe webhook | `webhook.e2e-spec.ts` | payment_intent.succeeded, payment_intent.failed |
| Owner auth | `owners-auth.e2e-spec.ts` | register, login, refresh, me |
| Admin dashboard | `admin.e2e-spec.ts` | stats, list agents/owners/orders, settings |

### Manual Testing Checklist

- [ ] Admin changes platform fee rate -> next order uses new rate
- [ ] Rate limit persists after backend restart
- [ ] Typing indicator works when two containers serve the same order
- [ ] Agent registration generates correct claim URL for current environment
- [ ] Stripe webhook fires agent webhook with correct history
- [ ] All 38 owner routes return same responses after controller decomposition
- [ ] Frontend builds successfully with shared package
- [ ] Admin dashboard builds successfully with shared package

---

## Success Metrics

### Code Quality

| Metric | Before | Target After |
|--------|--------|--------------|
| Hardcoded fee references | 3 | 0 |
| In-memory state Maps | 2 | 0 |
| Duplicated webhook code files | 2 | 1 (shared service) |
| Direct process.env in modules | 5+ files | 0 files |
| OwnersController lines | 890 | ~200 |
| OwnersController injected services | 8 | 2 |
| Duplicated httpService code | ~85% | ~15% (shared base) |
| Manual parseInt in controllers | 8+ | 0 |
| Missing database indexes | 5 | 0 |

### Test Coverage

| Metric | Before | Target After |
|--------|--------|--------------|
| Unit test files | 1 (boilerplate) | 8+ |
| E2E test files | 0 | 3+ |
| Tested services | 0 | 6 (PlatformSettings, WebhookHelper, Orders, Messages, Stripe, Redis) |

### Performance

| Metric | Before | Target After |
|--------|--------|--------------|
| BaseController.findAll | Loads all rows | SQL LIMIT/OFFSET |
| BaseController.count | Loads all rows | SQL COUNT(*) |
| Orders query (by seller) | Full table scan | Index-backed |
| Orders query (by buyer) | Full table scan | Index-backed |
| Orders query (by payment intent) | Full table scan | Index-backed |

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1 | Phase 1.1-1.3 | PlatformSettingsService, Redis integration, rate limiting + typing migrated |
| 1-2 | Phase 1.4-1.5 | ConfigService migration, WebhookHelperService extraction |
| 2-3 | Phase 2 | BaseController pagination fix, StripeService repository migration, AdminService cleanup, admin DTOs |
| 3-4 | Phase 3 | OwnersController decomposition, auth fix, minor API issues |
| 4-5 | Phase 4 | Frontend shared package, Docker fixes, gitignore |
| 5-6 | Phase 5 | Unit tests, E2E tests, documentation |

**Total estimated effort:** 12-16 developer-days over 4-6 weeks.

---

## Appendix: File Inventory

### Files to Create (New)

| File | Phase |
|------|-------|
| `/backend/src/modules/admin/platform-settings.service.ts` | 1.1 |
| `/backend/src/infrastructure/redis/redis.module.ts` | 1.2 |
| `/backend/src/infrastructure/redis/redis.service.ts` | 1.2 |
| `/backend/src/shared/services/webhook-helper.service.ts` | 1.5 |
| `/backend/src/shared/services/webhook-helper.module.ts` | 1.5 |
| `/backend/src/modules/admin/dto/admin-query.dto.ts` | 2.4 |
| `/backend/src/modules/owners/controllers/owner-orders.controller.ts` | 3.1 |
| `/backend/src/modules/owners/controllers/owner-messages.controller.ts` | 3.1 |
| `/backend/src/modules/owners/controllers/owner-notifications.controller.ts` | 3.1 |
| `/backend/src/modules/owners/controllers/owner-portfolios.controller.ts` | 3.1 |
| `/backend/src/modules/owners/controllers/owner-services.controller.ts` | 3.1 |
| `/backend/src/database/migrations/YYYYMMDD-AddOrderIndexes.ts` | Migration 1 |
| `/backend/src/database/migrations/YYYYMMDD-AddMessageIndexes.ts` | Migration 2 |
| `packages/frontend-common/` (entire package) | 4.1 |

### Files to Modify (Existing)

| File | Phase | Change Summary |
|------|-------|---------------|
| `/backend/src/modules/orders/orders.service.ts` | 1.1 | Inject PlatformSettingsService, remove hardcoded fee |
| `/backend/src/modules/stripe/stripe.service.ts` | 1.1, 1.4, 1.5, 2.2 | Remove fee, remove process.env, remove webhook duplication, use repos |
| `/backend/src/modules/messages/messages.service.ts` | 1.1, 1.2, 1.3, 1.5 | Remove fee, replace Maps with Redis, remove webhook duplication |
| `/backend/src/modules/owners/owner-jwt.strategy.ts` | 1.4 | ConfigService, remove insecure fallback |
| `/backend/src/modules/owners/owners.module.ts` | 1.4, 3.1 | ConfigService for JWT, register new controllers |
| `/backend/src/core/filters/http-exception.filter.ts` | 1.4 | ConfigService instead of process.env |
| `/backend/src/core/interceptors/logging.interceptor.ts` | 1.4 | ConfigService instead of process.env |
| `/backend/src/app.module.ts` | 1.2, 3.3 | Import RedisModule, fix ThrottlerModule, remove /test serve |
| `/backend/src/core/base/base.controller.ts` | 2.1 | Database pagination, SQL count |
| `/backend/src/core/base/base.service.ts` | 2.1 | Add findPaginated |
| `/backend/src/core/base/base.repository.ts` | 2.1 | Add findPaginated |
| `/backend/src/modules/admin/admin.service.ts` | 2.3 | Use repos for simple CRUD, delegate settings |
| `/backend/src/modules/admin/admin.module.ts` | 1.1, 2.3 | Export PlatformSettingsService |
| `/backend/src/modules/admin/admin.controller.ts` | 2.4 | Use typed DTOs |
| `/backend/src/modules/owners/owners.controller.ts` | 3.1 | Reduce to auth + profile |
| `/backend/src/modules/agents/agents.service.ts` | 3.3a | ConfigService for claim URL |
| `/backend/src/main.ts` | 3.3b | Update Swagger title |
| `/backend/src/modules/orders/entities/order.entity.ts` | Migration 1 | Add @Index decorators |
| `/backend/src/modules/messages/entities/message.entity.ts` | Migration 2 | Add @Index decorators |
| `/.gitignore` | 4.3 | Add agent-house-bot/generated/ |
| `/frontend/Dockerfile` | 4.2 | npm ci instead of npm install --force |
| `/frontend/app/services/httpService.ts` | 4.1 | Extend shared base |
| `/frontend-admin-dashboard/app/services/httpService.ts` | 4.1 | Extend shared base |
