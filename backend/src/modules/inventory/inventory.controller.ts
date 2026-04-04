import { FastifyRequest, FastifyReply } from 'fastify'
import { InventoryService } from './inventory.service'
import {
  CreateInventoryItemSchema,
  UpdateInventoryItemSchema,
  ReorderInventorySchema,
  ReplaceInventorySchema,
} from './inventory.schemas'
import { sendError } from '../../lib/errors'

export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  async listItems(req: FastifyRequest<{ Params: { poiId: string } }>, reply: FastifyReply) {
    try {
      const items = await this.service.listItems(req.params.poiId)
      return reply.send(items)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async addItem(req: FastifyRequest<{ Params: { poiId: string } }>, reply: FastifyReply) {
    try {
      const data = CreateInventoryItemSchema.parse(req.body)
      const item = await this.service.addItem(req.params.poiId, data)
      return reply.status(201).send(item)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async updateItem(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = UpdateInventoryItemSchema.parse(req.body)
      const item = await this.service.updateItem(req.params.id, data)
      return reply.send(item)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async deleteItem(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.service.deleteItem(req.params.id)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async reorder(req: FastifyRequest<{ Params: { poiId: string } }>, reply: FastifyReply) {
    try {
      const data = ReorderInventorySchema.parse(req.body)
      const items = await this.service.reorder(req.params.poiId, data)
      return reply.send(items)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async replace(req: FastifyRequest<{ Params: { poiId: string } }>, reply: FastifyReply) {
    try {
      const data = ReplaceInventorySchema.parse(req.body)
      const items = await this.service.replace(req.params.poiId, data)
      return reply.send(items)
    } catch (err) {
      return sendError(reply, err)
    }
  }
}
