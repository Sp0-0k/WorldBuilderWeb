import { FastifyInstance } from 'fastify'
import { InventoryRepository } from './inventory.repository'
import { InventoryService } from './inventory.service'
import { InventoryController } from './inventory.controller'

export async function inventoryRoutes(fastify: FastifyInstance) {
  const repo = new InventoryRepository(fastify.prisma)
  const service = new InventoryService(repo)
  const controller = new InventoryController(service)

  fastify.get('/pois/:poiId/inventory', (req, reply) => controller.listItems(req as any, reply))
  fastify.post('/pois/:poiId/inventory', (req, reply) => controller.addItem(req as any, reply))
  fastify.patch('/inventory/:id', (req, reply) => controller.updateItem(req as any, reply))
  fastify.delete('/inventory/:id', (req, reply) => controller.deleteItem(req as any, reply))
  fastify.put('/pois/:poiId/inventory/reorder', (req, reply) => controller.reorder(req as any, reply))
  fastify.put('/pois/:poiId/inventory/replace', (req, reply) => controller.replace(req as any, reply))
}
