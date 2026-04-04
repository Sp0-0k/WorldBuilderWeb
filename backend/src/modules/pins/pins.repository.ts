import { PrismaClient } from '@prisma/client'
import { AddPinInput } from './pins.schemas'

export class PinsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByWorldId(worldId: string) {
    return this.prisma.pin.findMany({ where: { worldId } })
  }

  async create(worldId: string, data: AddPinInput) {
    return this.prisma.pin.upsert({
      where: { worldId_entityId: { worldId, entityId: data.entityId } },
      update: {},
      create: { worldId, entityType: data.entityType, entityId: data.entityId },
    })
  }

  async delete(worldId: string, entityId: string) {
    return this.prisma.pin.deleteMany({
      where: { worldId, entityId },
    })
  }

  // For resolving entity names we need to query each table
  async resolveEntityName(entityType: string, entityId: string): Promise<string | null> {
    switch (entityType) {
      case 'world': {
        const e = await this.prisma.world.findUnique({ where: { id: entityId }, select: { name: true } })
        return e?.name ?? null
      }
      case 'country': {
        const e = await this.prisma.country.findUnique({ where: { id: entityId }, select: { name: true } })
        return e?.name ?? null
      }
      case 'city': {
        const e = await this.prisma.city.findUnique({ where: { id: entityId }, select: { name: true } })
        return e?.name ?? null
      }
      case 'poi': {
        const e = await this.prisma.pOI.findUnique({ where: { id: entityId }, select: { name: true } })
        return e?.name ?? null
      }
      case 'npc': {
        const e = await this.prisma.nPC.findUnique({ where: { id: entityId }, select: { name: true } })
        return e?.name ?? null
      }
      default:
        return null
    }
  }
}
