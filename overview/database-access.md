# Database Access Overview

WorldBuilderWeb uses Prisma as its data-access layer and MySQL as its primary datastore. Database access is intentionally centralized through repository classes in backend feature modules.

## High-level access pattern

1. A Fastify plugin creates and connects one Prisma client.
2. The plugin decorates the Fastify instance with `prisma`, making DB access available to route modules.
3. Route modules pass `fastify.prisma` into repositories.
4. Services call repositories to read/write domain entities.

This creates a single, explicit path from an HTTP request to a database query.

## Data model shape

The Prisma schema reflects a hierarchical world model and related systems:

- World hierarchy: world, country, city, POI, NPC
- Inventory attached to POIs
- Party, pins, and factions associated at world/entity levels
- Junction models for faction membership and city-faction links

## Migration/import support

A dedicated import script exists to move localStorage-exported world data into MySQL. This supports transitioning from local/mock data to persistent backend storage.

## Key references

- MySQL datasource and schema definitions: [backend/prisma/schema.prisma](../backend/prisma/schema.prisma#L1-L173)
- Prisma plugin lifecycle (`$connect`/`$disconnect`): [backend/src/plugins/prisma.ts](../backend/src/plugins/prisma.ts#L1-L27)
- Plugin registration in app startup: [backend/src/app.ts](../backend/src/app.ts#L25-L28)
- Repository injection from route module (example): [backend/src/modules/worlds/worlds.routes.ts](../backend/src/modules/worlds/worlds.routes.ts#L7-L9)
- Repository Prisma query methods (example): [backend/src/modules/worlds/worlds.repository.ts](../backend/src/modules/worlds/worlds.repository.ts#L1-L48)
- DB connectivity in health check: [backend/src/app.ts](../backend/src/app.ts#L31-L36)
- localStorage-to-MySQL import script: [backend/scripts/import-localStorage.ts](../backend/scripts/import-localStorage.ts#L1-L120)
