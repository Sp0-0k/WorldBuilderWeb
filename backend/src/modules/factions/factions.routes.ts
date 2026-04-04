import { FastifyInstance } from 'fastify'
import { FactionsRepository } from './factions.repository'
import { FactionsService } from './factions.service'
import { FactionsController } from './factions.controller'

export async function factionsRoutes(fastify: FastifyInstance) {
  const repo = new FactionsRepository(fastify.prisma)
  const service = new FactionsService(repo)
  const controller = new FactionsController(service)

  // World-scoped faction routes
  fastify.get('/worlds/:worldId/factions', (req, reply) => controller.listFactions(req as any, reply))
  fastify.post('/worlds/:worldId/factions', (req, reply) => controller.createFaction(req as any, reply))

  // Faction-level routes
  fastify.patch('/factions/:id', (req, reply) => controller.updateFaction(req as any, reply))
  fastify.delete('/factions/:id', (req, reply) => controller.deleteFaction(req as any, reply))
  fastify.post('/factions/:id/members', (req, reply) => controller.addMember(req as any, reply))
  fastify.delete('/factions/:id/members/:npcId', (req, reply) => controller.removeMember(req as any, reply))

  // City-faction link routes
  fastify.post('/cities/:cityId/factions/:factionId', (req, reply) =>
    controller.addCityLink(req as any, reply),
  )
  fastify.delete('/cities/:cityId/factions/:factionId', (req, reply) =>
    controller.removeCityLink(req as any, reply),
  )
}
