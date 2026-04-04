import { FastifyInstance } from 'fastify'
import { WorldsRepository } from './worlds.repository'
import { WorldsService } from './worlds.service'
import { WorldsController } from './worlds.controller'

export async function worldsRoutes(fastify: FastifyInstance) {
  const repo = new WorldsRepository(fastify.prisma)
  const service = new WorldsService(repo)
  const controller = new WorldsController(service)

  fastify.get('/worlds', (req, reply) => controller.listWorlds(req, reply))
  fastify.post('/worlds', (req, reply) => controller.createWorld(req, reply))
  fastify.patch('/worlds/:id', (req, reply) => controller.updateWorld(req as any, reply))
  fastify.delete('/worlds/:id', (req, reply) => controller.deleteWorld(req as any, reply))

  fastify.get('/worlds/:worldId/cities', (req, reply) => controller.listCitiesInWorld(req as any, reply))
  fastify.get('/worlds/:worldId/npcs', (req, reply) => controller.listNpcsInWorld(req as any, reply))
}
