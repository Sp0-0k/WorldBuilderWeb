import { PrismaClient } from '@prisma/client'
import { ReplacePartyInput } from './party.schemas'

export class PartyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByWorldId(worldId: string) {
    return this.prisma.partyMember.findMany({
      where: { worldId },
      orderBy: { name: 'asc' },
    })
  }

  async replace(worldId: string, data: ReplacePartyInput) {
    await this.prisma.$transaction(async (tx) => {
      await tx.partyMember.deleteMany({ where: { worldId } })
      if (data.members.length > 0) {
        await tx.partyMember.createMany({
          data: data.members.map((m) => ({ ...m, worldId })),
        })
      }
    })
    return this.findByWorldId(worldId)
  }
}
