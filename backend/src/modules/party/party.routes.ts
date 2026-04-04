import { FastifyInstance } from 'fastify'
import { PartyRepository } from './party.repository'
import { PartyService } from './party.service'
import { PartyController } from './party.controller'

export async function partyRoutes(fastify: FastifyInstance) {
  const repo = new PartyRepository(fastify.prisma)
  const service = new PartyService(repo)
  const controller = new PartyController(service)

  fastify.get('/worlds/:worldId/party', (req, reply) => controller.listParty(req as any, reply))
  fastify.put('/worlds/:worldId/party', (req, reply) => controller.replaceParty(req as any, reply))
}
