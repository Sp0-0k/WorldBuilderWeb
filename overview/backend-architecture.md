# Backend Architecture Overview

The backend is a modular Fastify application that exposes domain-specific route groups for worldbuilding data. The architecture follows a consistent flow in each feature module:

- **Routes** wire HTTP endpoints to a controller.
- **Controller** validates and parses incoming data and translates errors into HTTP responses.
- **Service** implements business behavior and cross-entity orchestration.
- **Repository** executes Prisma queries against MySQL.

This keeps transport concerns (HTTP), domain behavior, and persistence concerns separated.

## Request lifecycle

At startup, the app builds a Fastify instance, registers platform plugins (CORS, Helmet, Prisma, centralized error handling), exposes a health route, and then mounts feature route modules.

Each feature route module constructs repository/service/controller instances and binds route handlers. This dependency setup is explicit and repeated across feature modules, making behavior predictable and easy to trace.

## Feature modules

The backend is organized by capability under `backend/src/modules`:

- worlds
- entities
- inventory
- party
- pins
- factions
- search

Each module presents a focused API surface, while the world/entity hierarchy provides a shared model backbone.

## Operational shape

- Startup is handled by a small server entry point that loads environment variables and calls `buildApp()`.
- App-level config controls port, log level, CORS origin, and database URL.
- Health checks verify database reachability, not just process liveness.

## Key references

- App composition, plugin registration, route mounting: [backend/src/app.ts](../backend/src/app.ts#L17-L49)
- Health endpoint and DB probe: [backend/src/app.ts](../backend/src/app.ts#L30-L38)
- Server bootstrap/listen: [backend/src/server.ts](../backend/src/server.ts#L1-L17)
- Runtime environment map: [backend/src/config/env.ts](../backend/src/config/env.ts#L1-L7)
- Example route wiring (worlds): [backend/src/modules/worlds/worlds.routes.ts](../backend/src/modules/worlds/worlds.routes.ts#L1-L18)
- Example controller validation/error handling: [backend/src/modules/worlds/worlds.controller.ts](../backend/src/modules/worlds/worlds.controller.ts#L1-L63)
- Example service orchestration: [backend/src/modules/worlds/worlds.service.ts](../backend/src/modules/worlds/worlds.service.ts#L1-L56)
- Example repository persistence layer: [backend/src/modules/worlds/worlds.repository.ts](../backend/src/modules/worlds/worlds.repository.ts#L1-L48)
