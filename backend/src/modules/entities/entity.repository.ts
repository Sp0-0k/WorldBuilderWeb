import { PrismaClient } from '@prisma/client'
import {
  CreateCountryInput,
  UpdateCountryInput,
  CreateCityInput,
  UpdateCityInput,
  CreatePOIInput,
  UpdatePOIInput,
  CreateNPCInput,
  UpdateNPCInput,
} from './entity.schemas'

export class EntityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Country ────────────────────────────────────────────────────────────────

  async findCountryById(id: string) {
    return this.prisma.country.findUnique({ where: { id } })
  }

  async findCountriesByWorldId(worldId: string) {
    return this.prisma.country.findMany({
      where: { worldId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createCountry(data: CreateCountryInput) {
    const { parentId, ...rest } = data
    return this.prisma.country.create({
      data: { ...rest, worldId: parentId },
    })
  }

  async updateCountry(id: string, data: UpdateCountryInput) {
    return this.prisma.country.update({ where: { id }, data })
  }

  async deleteCountry(id: string) {
    return this.prisma.country.delete({ where: { id } })
  }

  // ─── City ───────────────────────────────────────────────────────────────────

  async findCityById(id: string) {
    return this.prisma.city.findUnique({
      where: { id },
      include: { keyFactionLinks: { select: { factionId: true } } },
    })
  }

  async findCitiesByCountryId(countryId: string) {
    return this.prisma.city.findMany({
      where: { countryId },
      include: { keyFactionLinks: { select: { factionId: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createCity(data: CreateCityInput) {
    const { parentId, ...rest } = data
    return this.prisma.city.create({
      data: { ...rest, countryId: parentId },
      include: { keyFactionLinks: { select: { factionId: true } } },
    })
  }

  async updateCity(id: string, data: UpdateCityInput) {
    return this.prisma.city.update({
      where: { id },
      data,
      include: { keyFactionLinks: { select: { factionId: true } } },
    })
  }

  async deleteCity(id: string) {
    return this.prisma.city.delete({ where: { id } })
  }

  // ─── POI ────────────────────────────────────────────────────────────────────

  async findPOIById(id: string) {
    return this.prisma.pOI.findUnique({ where: { id } })
  }

  async findPOIsByCityId(cityId: string) {
    return this.prisma.pOI.findMany({
      where: { cityId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createPOI(data: CreatePOIInput) {
    const { parentId, ...rest } = data
    return this.prisma.pOI.create({
      data: { ...rest, cityId: parentId },
    })
  }

  async updatePOI(id: string, data: UpdatePOIInput) {
    return this.prisma.pOI.update({ where: { id }, data })
  }

  async deletePOI(id: string) {
    return this.prisma.pOI.delete({ where: { id } })
  }

  // ─── NPC ────────────────────────────────────────────────────────────────────

  async findNPCById(id: string) {
    return this.prisma.nPC.findUnique({
      where: { id },
      include: { factionLinks: { select: { factionId: true } }, memories: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async findNPCsByPOIId(poiId: string) {
    return this.prisma.nPC.findMany({
      where: { poiId },
      include: { factionLinks: { select: { factionId: true } }, memories: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createNPC(data: CreateNPCInput) {
    const { parentId, ...rest } = data
    return this.prisma.nPC.create({
      data: { ...rest, poiId: parentId },
      include: { factionLinks: { select: { factionId: true } }, memories: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async updateNPC(id: string, data: UpdateNPCInput) {
    return this.prisma.nPC.update({
      where: { id },
      data,
      include: { factionLinks: { select: { factionId: true } }, memories: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async deleteNPC(id: string) {
    return this.prisma.nPC.delete({ where: { id } })
  }
}
