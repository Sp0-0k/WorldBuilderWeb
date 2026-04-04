import Fastify, { FastifyInstance } from 'fastify'
import { env } from './config/env'

import corsPlugin from './plugins/cors'
import helmetPlugin from './plugins/helmet'
import prismaPlugin from './plugins/prisma'
import errorHandlerPlugin from './plugins/errorHandler'

import { worldsRoutes } from './modules/worlds/worlds.routes'
import { entityRoutes } from './modules/entities/entity.routes'
import { inventoryRoutes } from './modules/inventory/inventory.routes'
import { partyRoutes } from './modules/party/party.routes'
import { pinsRoutes } from './modules/pins/pins.routes'
import { factionsRoutes } from './modules/factions/factions.routes'
import { searchRoutes } from './modules/search/search.routes'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
    },
  })

  // Plugins
  await fastify.register(corsPlugin)
  await fastify.register(helmetPlugin)
  await fastify.register(prismaPlugin)
  await fastify.register(errorHandlerPlugin)

  // Health check (registered before other routes, no auth needed)
  fastify.get('/health', async (_req, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`
      return reply.send({ status: 'ok' })
    } catch {
      return reply.status(503).send({ status: 'error', message: 'Database unreachable' })
    }
  })

  // Routes
  await fastify.register(worldsRoutes)
  await fastify.register(entityRoutes)
  await fastify.register(inventoryRoutes)
  await fastify.register(partyRoutes)
  await fastify.register(pinsRoutes)
  await fastify.register(factionsRoutes)
  await fastify.register(searchRoutes)

  return fastify
}
