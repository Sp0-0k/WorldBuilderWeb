import { FastifyRequest, FastifyReply } from 'fastify'
import { WorldsService } from './worlds.service'
import { CreateWorldSchema, UpdateWorldSchema } from './worlds.schemas'
import { sendError } from '../../lib/errors'

export class WorldsController {
  constructor(private readonly service: WorldsService) {}

  async listWorlds(_req: FastifyRequest, reply: FastifyReply) {
    try {
      const worlds = await this.service.listWorlds()
      return reply.send(worlds)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async createWorld(req: FastifyRequest, reply: FastifyReply) {
    try {
      const body = CreateWorldSchema.parse(req.body)
      const world = await this.service.createWorld(body)
      return reply.status(201).send(world)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async updateWorld(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const body = UpdateWorldSchema.parse(req.body)
      const world = await this.service.updateWorld(req.params.id, body)
      return reply.send(world)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async deleteWorld(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.service.deleteWorld(req.params.id)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async listCitiesInWorld(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const cities = await this.service.listCitiesInWorld(req.params.worldId)
      return reply.send(cities)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async listNpcsInWorld(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const npcs = await this.service.listNpcsInWorld(req.params.worldId)
      return reply.send(npcs)
    } catch (err) {
      return sendError(reply, err)
    }
  }
}
