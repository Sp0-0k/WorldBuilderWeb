import { FastifyRequest, FastifyReply } from 'fastify'
import { PartyService } from './party.service'
import { ReplacePartySchema } from './party.schemas'
import { sendError } from '../../lib/errors'

export class PartyController {
  constructor(private readonly service: PartyService) {}

  async listParty(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const members = await this.service.listParty(req.params.worldId)
      return reply.send(members)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async replaceParty(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const data = ReplacePartySchema.parse(req.body)
      const members = await this.service.replaceParty(req.params.worldId, data)
      return reply.send(members)
    } catch (err) {
      return sendError(reply, err)
    }
  }
}
