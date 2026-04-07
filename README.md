# WorldBuilderWeb

WorldBuilderWeb is a full-stack D&D worldbuilding application. It helps users create and navigate a hierarchical world model (worlds, countries, cities, points of interest, NPCs), then layer in party state, factions, pins, search, and inventory.

The project is split into:

- **Frontend (`frontend/`)**: React + Vite + Mantine client that drives the editing and navigation experience.
- **Backend (`backend/`)**: Fastify + TypeScript API using Prisma for MySQL persistence.

## How the app works (high-level)

1. The backend server boots Fastify, registers security/data/error plugins, and mounts feature route modules.
2. The frontend loads a routed workspace UI and selects a data backend at runtime:
   - **HTTP mode** (`VITE_USE_API=true`): uses REST endpoints on the Fastify server.
   - **Mock mode** (`VITE_USE_API=false`): uses local in-memory/localStorage-backed mock service.
   - Login/session behavior uses a frontend-only `AuthContext` session model (UI state only), with no backend API auth enforcement.
3. The entity workspace resolves an entity by route (`/view/:type/:id`), builds parent context, fetches children, and renders editing/creation controls.
4. Optional AI features generate POIs, NPCs, and inventory through direct calls to OpenAI Responses API (configured via frontend environment variable).

## Core feature overviews

- [Backend architecture](overview/backend-architecture.md)
- [Frontend architecture and data flow](overview/frontend-data-flow.md)
- [Database access](overview/database-access.md)
- [Generative AI integration](overview/generative-ai.md)

## Run modes and environment

### Backend

Primary backend configuration is centralized in environment loading and typed environment mapping.

- The server entry point loads dotenv and starts on the configured host/port.
- Database connectivity is provided through Prisma and attached as a Fastify instance decorator.

### Frontend

The frontend can run against either the real API or the mock implementation.

- `VITE_USE_API=true` switches to `HttpDataService`.
- `VITE_API_URL` controls the backend base URL.
- `VITE_OPENAI_API_KEY` enables AI generation features.

Authentication note:

- Current login/session behavior uses a frontend-only `AuthContext` session model (UI state only) and does not provide backend route protection.

## Data model shape

The Prisma schema models world hierarchy and adjacent systems:

- Hierarchy: `World -> Country -> City -> POI -> NPC`
- Adjacent systems: inventory items at POI level, per-world party members, per-world pins, factions and faction membership, city-faction links.

## Key references

- App assembly and route/plugin registration: [backend/src/app.ts](backend/src/app.ts#L17-L49)
- Server startup and listen lifecycle: [backend/src/server.ts](backend/src/server.ts#L1-L17)
- Environment configuration: [backend/src/config/env.ts](backend/src/config/env.ts#L1-L7)
- Prisma schema root and core models: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L1-L173)
- Frontend app routing: [frontend/src/App.tsx](frontend/src/App.tsx#L1-L22)
- Frontend bootstrapping/theme/notifications: [frontend/src/main.tsx](frontend/src/main.tsx#L1-L19)
- Data service mode toggle: [frontend/src/data/dataService.ts](frontend/src/data/dataService.ts#L1-L11)
- Frontend auth context: [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx#L1-L34)
