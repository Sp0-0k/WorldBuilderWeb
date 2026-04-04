import { FastifyRequest, FastifyReply } from 'fastify'
import { FactionsService } from './factions.service'
import { CreateFactionSchema, UpdateFactionSchema, AddFactionMemberSchema } from './factions.schemas'
import { sendError } from '../../lib/errors'

export class FactionsController {
  constructor(private readonly service: FactionsService) {}

  async listFactions(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const factions = await this.service.listFactions(req.params.worldId)
      return reply.send(factions)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async createFaction(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const data = CreateFactionSchema.parse(req.body)
      const faction = await this.service.createFaction(req.params.worldId, data)
      return reply.status(201).send(faction)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async updateFaction(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = UpdateFactionSchema.parse(req.body)
      const faction = await this.service.updateFaction(req.params.id, data)
      return reply.send(faction)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async deleteFaction(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      await this.service.deleteFaction(req.params.id)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async addMember(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const data = AddFactionMemberSchema.parse(req.body)
      const member = await this.service.addMember(req.params.id, data)
      return reply.status(201).send(member)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async removeMember(
    req: FastifyRequest<{ Params: { id: string; npcId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await this.service.removeMember(req.params.id, req.params.npcId)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async addCityLink(
    req: FastifyRequest<{ Params: { cityId: string; factionId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const link = await this.service.addCityLink(req.params.cityId, req.params.factionId)
      return reply.status(201).send(link)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async removeCityLink(
    req: FastifyRequest<{ Params: { cityId: string; factionId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await this.service.removeCityLink(req.params.cityId, req.params.factionId)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }
}
