import { PrismaClient } from '@prisma/client'

export class SearchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async search(worldId: string, query: string, limit: number) {
    const contains = query

    const [countries, cities, pois, npcs] = await Promise.all([
      this.prisma.country.findMany({
        where: { worldId, name: { contains } },
        take: limit,
        select: { id: true, name: true, worldId: true },
      }),

      this.prisma.city.findMany({
        where: { country: { worldId }, name: { contains } },
        take: limit,
        select: { id: true, name: true, countryId: true },
      }),

      this.prisma.pOI.findMany({
        where: { city: { country: { worldId } }, name: { contains } },
        take: limit,
        select: { id: true, name: true, cityId: true },
      }),

      this.prisma.nPC.findMany({
        where: { poi: { city: { country: { worldId } } }, name: { contains } },
        take: limit,
        select: { id: true, name: true, poiId: true },
      }),
    ])

    return { countries, cities, pois, npcs }
  }
}
