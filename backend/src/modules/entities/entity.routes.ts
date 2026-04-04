import { FastifyInstance } from 'fastify'
import { EntityRepository } from './entity.repository'
import { EntityService } from './entity.service'
import { EntityController } from './entity.controller'
import { WorldsRepository } from '../worlds/worlds.repository'

export async function entityRoutes(fastify: FastifyInstance) {
  const repo = new EntityRepository(fastify.prisma)
  const worldsRepo = new WorldsRepository(fastify.prisma)
  const service = new EntityService(repo, worldsRepo)
  const controller = new EntityController(service)

  // GET single entity
  fastify.get('/entities/:type/:id', (req, reply) => controller.getEntity(req as any, reply))

  // GET children of a parent entity
  fastify.get('/entities/:parentType/:parentId/children/:childType', (req, reply) =>
    controller.getChildren(req as any, reply),
  )

  // POST create entity
  fastify.post('/entities/:type', (req, reply) => controller.createEntity(req as any, reply))

  // PATCH update entity
  fastify.patch('/entities/:type/:id', (req, reply) => controller.updateEntity(req as any, reply))

  // DELETE entity
  fastify.delete('/entities/:type/:id', (req, reply) => controller.deleteEntity(req as any, reply))
}
