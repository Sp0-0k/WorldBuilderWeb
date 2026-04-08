# Technical Overview

This document captures the implementation-level architecture and runtime behavior for WorldBuilderWeb.

## System overview

WorldBuilderWeb is a full-stack D&D worldbuilding application with:

- **Frontend (`frontend/`)**: React + Vite + Mantine application for editing and navigating world data.
- **Backend (`backend/`)**: Fastify + TypeScript API backed by Prisma + MySQL.

The domain model centers on:

`World -> Country -> City -> POI -> NPC`

with adjacent systems for party, factions, pins, search, and inventory.

## Runtime flow (high level)

1. The backend starts Fastify, registers plugins (security, Prisma, error handling), and mounts route modules.
2. The frontend starts a routed SPA and resolves the data backend at runtime.
3. The entity workspace route (`/view/:type/:id`) loads entity data, parent chain context, and child entities.
4. Optional AI features call the OpenAI Responses API from the frontend when configured.

## Data access modes

The frontend uses a single `IDataService` contract and chooses one implementation:

- **HTTP mode** (`VITE_USE_API=true`): `HttpDataService` calling Fastify REST endpoints.
- **Mock mode** (`VITE_USE_API=false`): `MockDataService` using local in-memory/localStorage-backed behavior.

This allows the UI to run without API changes by switching only environment configuration.

## Environment and configuration

### Backend environment

Primary environment variables:

- `DATABASE_URL`
- `PORT` (default: `3001`)
- `CORS_ORIGIN` (default: `http://localhost:5173`)
- `LOG_LEVEL` (default: `info`)
- `NODE_ENV` (default: `development`)

### Frontend environment

Primary environment variables:

- `VITE_USE_API`
- `VITE_API_URL`
- `VITE_OPENAI_API_KEY` (optional; enables AI generation)

## Authentication/session note

Current login/session behavior uses a frontend-only `AuthContext` session model (UI state only). Backend API routes are not protected by auth middleware in the current architecture.

## Data model shape

Prisma models the hierarchical world and related systems:

- Hierarchy: `World -> Country -> City -> POI -> NPC`
- Adjacent systems:
  - Inventory items at POI level
  - Per-world party members (name, level, class, race)
  - Per-world pins
  - Factions, faction memberships, and city-faction links
  - NPC memories (diary entries persisted from chat sessions or added manually)

## Module architecture

Backend modules follow a consistent pattern:

- `*.routes.ts` defines HTTP routes and module wiring
- `*.controller.ts` handles request parsing/validation and HTTP responses
- `*.service.ts` contains business logic orchestration
- `*.repository.ts` encapsulates Prisma/database access

Current modules under `backend/src/modules` include:

- worlds
- entities
- inventory
- party
- pins
- factions
- search
- memories

## Key references

- App assembly and route/plugin registration: [backend/src/app.ts](../backend/src/app.ts#L17-L49)
- Server startup/listen lifecycle: [backend/src/server.ts](../backend/src/server.ts#L1-L17)
- Environment mapping: [backend/src/config/env.ts](../backend/src/config/env.ts#L1-L7)
- Prisma schema root and core models: [backend/prisma/schema.prisma](../backend/prisma/schema.prisma#L1-L173)
- Frontend app routing: [frontend/src/App.tsx](../frontend/src/App.tsx#L1-L22)
- Frontend bootstrapping/theme/notifications: [frontend/src/main.tsx](../frontend/src/main.tsx#L1-L19)
- Data service mode selection: [frontend/src/data/dataService.ts](../frontend/src/data/dataService.ts#L1-L11)
- Frontend auth context: [frontend/src/contexts/AuthContext.tsx](../frontend/src/contexts/AuthContext.tsx#L1-L34)

## Related docs

- [Backend architecture](backend-architecture.md)
- [Frontend architecture and data flow](frontend-data-flow.md)
- [Database access](database-access.md)
- [Generative AI integration](generative-ai.md)