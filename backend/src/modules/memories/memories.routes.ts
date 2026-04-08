import { FastifyInstance } from 'fastify'
import { MemoriesRepository } from './memories.repository'
import { MemoriesService } from './memories.service'
import { MemoriesController } from './memories.controller'

export async function memoriesRoutes(fastify: FastifyInstance) {
  const repo       = new MemoriesRepository(fastify.prisma)
  const service    = new MemoriesService(repo)
  const controller = new MemoriesController(service)

  fastify.get('/npcs/:npcId/memories',  (req, reply) => controller.list(req, reply))
  fastify.post('/npcs/:npcId/memories', (req, reply) => controller.create(req, reply))
  fastify.patch('/memories/:id',        (req, reply) => controller.update(req, reply))
  fastify.delete('/memories/:id',       (req, reply) => controller.delete(req, reply))
}
