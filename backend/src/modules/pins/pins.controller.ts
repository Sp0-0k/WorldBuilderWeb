import { FastifyRequest, FastifyReply } from 'fastify'
import { PinsService } from './pins.service'
import { AddPinSchema } from './pins.schemas'
import { sendError } from '../../lib/errors'

export class PinsController {
  constructor(private readonly service: PinsService) {}

  async listPins(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const pins = await this.service.listPins(req.params.worldId)
      return reply.send(pins)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async addPin(req: FastifyRequest<{ Params: { worldId: string } }>, reply: FastifyReply) {
    try {
      const data = AddPinSchema.parse(req.body)
      const pin = await this.service.addPin(req.params.worldId, data)
      return reply.status(201).send(pin)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async removePin(
    req: FastifyRequest<{ Params: { worldId: string; entityId: string } }>,
    reply: FastifyReply,
  ) {
    try {
      await this.service.removePin(req.params.worldId, req.params.entityId)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }
}
