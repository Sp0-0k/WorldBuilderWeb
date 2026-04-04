import { FastifyRequest, FastifyReply } from 'fastify'
import { EntityService } from './entity.service'
import {
  EntityTypeSchema,
  CreateCountrySchema,
  UpdateCountrySchema,
  CreateCitySchema,
  UpdateCitySchema,
  CreatePOISchema,
  UpdatePOISchema,
  CreateNPCSchema,
  UpdateNPCSchema,
} from './entity.schemas'
import { sendError, BadRequestError } from '../../lib/errors'

function parseCreateSchema(type: string, body: unknown) {
  switch (type) {
    case 'country': return CreateCountrySchema.parse(body)
    case 'city': return CreateCitySchema.parse(body)
    case 'poi': return CreatePOISchema.parse(body)
    case 'npc': return CreateNPCSchema.parse(body)
    default: throw new BadRequestError(`Unknown entity type: ${type}`)
  }
}

function parseUpdateSchema(type: string, body: unknown) {
  switch (type) {
    case 'country': return UpdateCountrySchema.parse(body)
    case 'city': return UpdateCitySchema.parse(body)
    case 'poi': return UpdatePOISchema.parse(body)
    case 'npc': return UpdateNPCSchema.parse(body)
    default: throw new BadRequestError(`Unknown entity type: ${type}`)
  }
}

export class EntityController {
  constructor(private readonly service: EntityService) {}

  async getEntity(req: FastifyRequest<{ Params: { type: string; id: string } }>, reply: FastifyReply) {
    try {
      const type = EntityTypeSchema.parse(req.params.type)
      const entity = await this.service.getEntity(type, req.params.id)
      return reply.send(entity)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async getChildren(
    req: FastifyRequest<{ Params: { parentType: string; parentId: string; childType: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const childType = EntityTypeSchema.parse(req.params.childType)
      const children = await this.service.getChildren(req.params.parentType, req.params.parentId, childType)
      return reply.send(children)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async createEntity(req: FastifyRequest<{ Params: { type: string } }>, reply: FastifyReply) {
    try {
      const type = EntityTypeSchema.parse(req.params.type)
      const data = parseCreateSchema(type, req.body)
      const entity = await this.service.createEntity(type, data)
      return reply.status(201).send(entity)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async updateEntity(req: FastifyRequest<{ Params: { type: string; id: string } }>, reply: FastifyReply) {
    try {
      const type = EntityTypeSchema.parse(req.params.type)
      const data = parseUpdateSchema(type, req.body)
      const entity = await this.service.updateEntity(type, req.params.id, data)
      return reply.send(entity)
    } catch (err) {
      return sendError(reply, err)
    }
  }

  async deleteEntity(req: FastifyRequest<{ Params: { type: string; id: string } }>, reply: FastifyReply) {
    try {
      const type = EntityTypeSchema.parse(req.params.type)
      await this.service.deleteEntity(type, req.params.id)
      return reply.status(204).send()
    } catch (err) {
      return sendError(reply, err)
    }
  }
}
