import { PrismaClient } from '@prisma/client'
import { CreateFactionInput, UpdateFactionInput, AddFactionMemberInput } from './factions.schemas'

const factionInclude = {
  members: {
    select: { npcId: true, role: true },
  },
}

export class FactionsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByWorldId(worldId: string) {
    return this.prisma.faction.findMany({
      where: { worldId },
      include: factionInclude,
      orderBy: { createdAt: 'asc' },
    })
  }

  async findById(id: string) {
    return this.prisma.faction.findUnique({
      where: { id },
      include: factionInclude,
    })
  }

  async create(worldId: string, data: CreateFactionInput) {
    return this.prisma.faction.create({
      data: { ...data, worldId },
      include: factionInclude,
    })
  }

  async update(id: string, data: UpdateFactionInput) {
    return this.prisma.faction.update({
      where: { id },
      data,
      include: factionInclude,
    })
  }

  async delete(id: string) {
    // CityFaction rows are cascade-deleted by DB; FactionMember rows also cascade
    return this.prisma.faction.delete({ where: { id } })
  }

  async upsertMember(factionId: string, data: AddFactionMemberInput) {
    return this.prisma.factionMember.upsert({
      where: { factionId_npcId: { factionId, npcId: data.npcId } },
      update: { role: data.role },
      create: { factionId, npcId: data.npcId, role: data.role },
    })
  }

  async removeMember(factionId: string, npcId: string) {
    return this.prisma.factionMember.delete({
      where: { factionId_npcId: { factionId, npcId } },
    })
  }

  async addCityLink(cityId: string, factionId: string) {
    return this.prisma.cityFaction.upsert({
      where: { cityId_factionId: { cityId, factionId } },
      update: {},
      create: { cityId, factionId },
    })
  }

  async removeCityLink(cityId: string, factionId: string) {
    return this.prisma.cityFaction.delete({
      where: { cityId_factionId: { cityId, factionId } },
    })
  }
}
