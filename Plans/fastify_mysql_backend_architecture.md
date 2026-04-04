# Fastify + MySQL Backend Architecture Plan

## 1) Goals and Non-Goals

### Goals
- Replace browser `localStorage` persistence with a production-style backend API.
- Preserve the current frontend mental model and API surface (minimal UI refactor).
- Keep infrastructure and operating costs low for a class project / small team.
- Support clean growth path to multi-user auth and collaboration.

### Non-Goals (for V1)
- No microservices.
- No event bus / queue.
- No full-text search engine.
- No hard multi-tenant architecture.

---

## 2) Recommended Stack (Cost-Conscious)

- **Runtime**: Node.js 22 LTS
- **Framework**: Fastify 5.x
- **Language**: TypeScript
- **ORM**: Prisma (MySQL provider)
- **Validation**: Zod (+ `fastify-type-provider-zod`)
- **Auth (optional in V1)**: JWT via `@fastify/jwt`
- **Security**: `@fastify/helmet`, `@fastify/cors`, rate limiting
- **Logging**: Pino (native in Fastify)
- **Testing**: Vitest + Supertest
- **DB**: MySQL 8.0+
- **Containerization**: Docker + docker compose

Why this stack:
- Fastify is fast and lightweight.
- Prisma lowers SQL boilerplate and migration pain.
- Single API + single DB keeps monthly cost and complexity minimal.

---

## 3) High-Level Architecture

```mermaid
flowchart LR
  FE[React Frontend] -->|HTTPS REST| API[Fastify API]
  API --> SRV[Service Layer / Business Rules]
  SRV --> REPO[Prisma Repositories]
  REPO --> DB[(MySQL)]
  API --> LOG[Pino Logs]
```

### Layers
1. **Routes/Controllers**: Request parsing, validation, HTTP responses.
2. **Services**: Business logic (cascade actions, relationship consistency).
3. **Repositories**: Prisma access, transactions, query composition.
4. **Database**: Source of truth.

---

## 4) Backend Project Layout

```text
backend/
  src/
    app.ts
    server.ts
    config/
      env.ts
    plugins/
      cors.ts
      helmet.ts
      auth.ts
      prisma.ts
      rateLimit.ts
      errorHandler.ts
    modules/
      entities/
        entity.routes.ts
        entity.controller.ts
        entity.service.ts
        entity.repository.ts
        entity.schemas.ts
      inventory/
      factions/
      party/
      pins/
      search/
      worlds/
    lib/
      errors.ts
      pagination.ts
      ids.ts
  prisma/
    schema.prisma
    migrations/
  tests/
  Dockerfile
  docker-compose.yml
```

---

## 5) Domain Model (MySQL)

Use UUID primary keys (CHAR(36) or BINARY(16)); avoid random short IDs in backend.

### Core tables
- `worlds`
- `countries` (FK `world_id`)
- `cities` (FK `country_id`)
- `pois` (FK `city_id`)
- `npcs` (FK `poi_id`)
- `inventory_items` (FK `poi_id`)
- `party_members`
- `pins` (references polymorphic entity id+type)
- `factions` (FK `world_id`, optional FK `stronghold_city_id`)
- `faction_members` (FK `faction_id`, FK `npc_id`, unique pair)
- optional mapping tables for future many-to-many references

### Foreign key strategy
- Hierarchy deletes should be **database-enforced** with `ON DELETE CASCADE`:
  - world -> country -> city -> poi -> npc
  - poi -> inventory_items
  - faction -> faction_members
- `factions.stronghold_city_id` should use `ON DELETE SET NULL`.

### Suggested indexes
- `countries(world_id)`
- `cities(country_id)`
- `pois(city_id)`
- `npcs(poi_id)`
- `inventory_items(poi_id, sort_order)`
- `factions(world_id)`
- `faction_members(faction_id, npc_id)` unique
- Search support: `name` indexes on major entity tables (or FULLTEXT if needed later)

### Auditing columns (all mutable tables)
- `created_at DATETIME(3)`
- `updated_at DATETIME(3)`

---

## 6) API Contract (Map to Current Frontend Service)

Keep contracts close to current `APIService` methods to minimize frontend rewrites.

### Worlds / Entities
- `GET /worlds`
- `GET /entities/:type/:id`
- `GET /entities/:parentType/:parentId/children/:childType`
- `POST /entities/:type`
- `PATCH /entities/:type/:id`
- `DELETE /entities/:type/:id`

### Inventory
- `GET /pois/:poiId/inventory`
- `POST /pois/:poiId/inventory`
- `PATCH /inventory/:id`
- `DELETE /inventory/:id`
- `PUT /pois/:poiId/inventory/reorder`
- `PUT /pois/:poiId/inventory/replace`

### Party
- `GET /party`
- `PUT /party`

### Pins
- `GET /pins`
- `POST /pins` (body: `{ entityType, entityId }`)
- `DELETE /pins/:entityType/:entityId`

### Factions
- `GET /worlds/:worldId/factions`
- `POST /worlds/:worldId/factions`
- `PATCH /factions/:id`
- `DELETE /factions/:id`
- `POST /factions/:id/members`
- `DELETE /factions/:id/members/:npcId`

### Search
- `GET /search?worldId=<id>&q=<query>&limit=20`

### Health
- `GET /health`

#### Response conventions
- Success envelopes optional for V1; keep consistent either:
  - raw JSON entities, or
  - `{ data, meta }` wrapper.
- Errors:
  - `{ error: { code, message, details? } }`

---

## 7) Service-Level Rules (Critical)

Implement these in services (plus FK constraints):

1. **Cascade delete behavior parity**
   - Deleting a world removes its descendants and related records.
   - Deleting a POI removes NPCs and inventory.

2. **Faction consistency**
   - Adding NPC to faction updates junction table.
   - Removing faction membership removes only that membership.

3. **World-scoped search**
   - Restrict search results to descendants of the selected world.

4. **Inventory ordering**
   - Add `sort_order` int column; `reorder` updates ordering transactionally.

5. **Transactions**
   - Use Prisma transactions for multi-table updates.

---

## 8) Security and Access

### V1 (lowest complexity)
- CORS locked to frontend origin(s).
- No user auth if single-user local deployment.
- Basic rate limiting per IP.

### V2 (recommended)
- JWT auth with `user_id` ownership fields on data tables.
- All queries filtered by `user_id`.
- Add role support only if needed.

### Input safety
- Validate all payloads with Zod.
- Reject unknown fields.
- Limit body size to prevent abuse.

---

## 9) Environment and Configuration

Required env vars:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL` (Prisma MySQL DSN)
- `CORS_ORIGIN`
- `JWT_SECRET` (if auth enabled)
- `LOG_LEVEL`

Example local DSN:
- `mysql://worldbuilder:worldbuilder@localhost:3306/worldbuilder`

---

## 10) Deployment (Low Cost)

### Option A: Single VPS (cheapest)
- One VM running:
  - `backend` container
  - `mysql` container
  - reverse proxy (Caddy/Nginx)
- Pros: cheapest monthly.
- Cons: more ops responsibility.

### Option B: Managed MySQL + cheap app host
- API on Fly.io/Render/Railway
- DB on managed MySQL
- Pros: easier operations and backups.
- Cons: slightly higher monthly cost.

### Backups
- Nightly `mysqldump` retained for 7–14 days minimum.
- Test restore procedure monthly.

---

## 11) Observability and Operations

- Structured logs with request IDs.
- Health endpoint checks DB connectivity.
- Basic metrics (request latency/error rates).
- Slow query logging at DB level.

---

## 12) Migration Plan from Current LocalStorage

### Phase 1: Backend foundation
1. Scaffold backend + Fastify plugins.
2. Define Prisma schema + run migrations.
3. Implement health + worlds/entities endpoints.

### Phase 2: Feature parity
4. Implement inventory/faction/party/pins/search endpoints.
5. Preserve existing frontend method signatures in a new HTTP data service.

### Phase 3: Data cutover
6. Add one-time import endpoint/script that accepts existing localStorage JSON shape.
7. Migrate sample/local data to MySQL.
8. Switch frontend from `MockDataService` to `HttpDataService`.

### Phase 4: Hardening
9. Add auth, ownership filtering, and request throttling.
10. Add integration tests for cascade delete/search correctness.

---

## 13) Frontend Integration Strategy

Create a backend-backed service implementing the same method surface as current `APIService`:
- `getWorlds`
- `getEntityByRoute`
- `getChildren`
- `createEntity`
- `updateEntity`
- `deleteEntity`
- inventory / party / pins / faction methods

This preserves almost all component code and localizes migration to the data layer.

---

## 14) MVP Build Checklist

- [ ] Backend scaffolded with Fastify + TypeScript
- [ ] Prisma schema and initial migration committed
- [ ] All CRUD endpoints implemented for current feature set
- [ ] Zod validation on all write routes
- [ ] DB transactions on multi-step operations
- [ ] CORS + helmet + rate limit configured
- [ ] Docker compose local dev stack working
- [ ] LocalStorage import script tested
- [ ] Frontend switched to HTTP service
- [ ] Smoke test: create/edit/delete/search/inventory/factions

---

## 15) Notes for Cost Control

- Start with one environment (dev/prod combined if acceptable for class project).
- Avoid premature caching layers.
- Keep binary assets out of DB (if later needed, use object storage).
- Add paid services only when usage validates need.

---

## 16) Suggested Next Implementation Steps

1. Create `backend/` with Fastify + Prisma scaffold.
2. Implement core entity hierarchy endpoints first.
3. Add import script for existing `worldBuilderData` JSON.
4. Replace frontend data service internals while keeping method names stable.
5. Run end-to-end smoke tests and then retire localStorage writes.
