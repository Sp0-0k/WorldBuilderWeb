import { PrismaClient } from '@prisma/client'
import { CreateMemoryInput, UpdateMemoryInput } from './memories.schemas'

export class MemoriesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByNpcId(npcId: string) {
    return this.prisma.npcMemory.findMany({
      where: { npcId },
      orderBy: { createdAt: 'asc' },
    })
  }

  findById(id: string) {
    return this.prisma.npcMemory.findUnique({ where: { id } })
  }

  create(npcId: string, data: CreateMemoryInput) {
    return this.prisma.npcMemory.create({ data: { ...data, npcId } })
  }

  update(id: string, data: UpdateMemoryInput) {
    return this.prisma.npcMemory.update({
      where: { id },
      data: {
        content: data.content,
        ...(data.createdAt ? { createdAt: new Date(data.createdAt) } : {}),
      },
    })
  }

  delete(id: string) {
    return this.prisma.npcMemory.delete({ where: { id } })
  }
}
