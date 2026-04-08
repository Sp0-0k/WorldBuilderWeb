import { FastifyRequest, FastifyReply } from 'fastify'
import { MemoriesService } from './memories.service'
import {
  CreateMemoryBody,
  UpdateMemoryBody,
  NpcIdParam,
  MemoryIdParam,
} from './memories.schemas'

export class MemoriesController {
  constructor(private readonly service: MemoriesService) {}

  async list(req: FastifyRequest, reply: FastifyReply) {
    const { npcId } = NpcIdParam.parse(req.params)
    const memories = await this.service.listForNpc(npcId)
    return reply.send(memories)
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const { npcId } = NpcIdParam.parse(req.params)
    const body = CreateMemoryBody.parse(req.body)
    const memory = await this.service.create(npcId, body)
    return reply.status(201).send(memory)
  }

  async update(req: FastifyRequest, reply: FastifyReply) {
    const { id } = MemoryIdParam.parse(req.params)
    const body = UpdateMemoryBody.parse(req.body)
    const memory = await this.service.update(id, body)
    return reply.send(memory)
  }

  async delete(req: FastifyRequest, reply: FastifyReply) {
    const { id } = MemoryIdParam.parse(req.params)
    await this.service.delete(id)
    return reply.status(204).send()
  }
}
