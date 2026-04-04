import { FastifyInstance } from 'fastify'
import { PinsRepository } from './pins.repository'
import { PinsService } from './pins.service'
import { PinsController } from './pins.controller'

export async function pinsRoutes(fastify: FastifyInstance) {
  const repo = new PinsRepository(fastify.prisma)
  const service = new PinsService(repo)
  const controller = new PinsController(service)

  fastify.get('/worlds/:worldId/pins', (req, reply) => controller.listPins(req as any, reply))
  fastify.post('/worlds/:worldId/pins', (req, reply) => controller.addPin(req as any, reply))
  fastify.delete('/worlds/:worldId/pins/:entityId', (req, reply) => controller.removePin(req as any, reply))
}
