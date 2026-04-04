import { PrismaClient } from '@prisma/client'
import { CreateWorldInput, UpdateWorldInput } from './worlds.schemas'

export class WorldsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll() {
    return this.prisma.world.findMany({
      orderBy: { createdAt: 'asc' },
    })
  }

  async findById(id: string) {
    return this.prisma.world.findUnique({ where: { id } })
  }

  async create(data: CreateWorldInput) {
    return this.prisma.world.create({ data })
  }

  async update(id: string, data: UpdateWorldInput) {
    return this.prisma.world.update({ where: { id }, data })
  }

  async delete(id: string) {
    return this.prisma.world.delete({ where: { id } })
  }

  async findAllCitiesInWorld(worldId: string) {
    return this.prisma.city.findMany({
      where: {
        country: { worldId },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findAllNpcsInWorld(worldId: string) {
    return this.prisma.nPC.findMany({
      where: {
        poi: {
          city: {
            country: { worldId },
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  }
}
