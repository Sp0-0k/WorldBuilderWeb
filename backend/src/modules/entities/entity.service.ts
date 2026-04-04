import { EntityRepository } from './entity.repository'
import {
  EntityType,
  CreateCountryInput,
  UpdateCountryInput,
  CreateCityInput,
  UpdateCityInput,
  CreatePOIInput,
  UpdatePOIInput,
  CreateNPCInput,
  UpdateNPCInput,
} from './entity.schemas'
import { NotFoundError, BadRequestError } from '../../lib/errors'

function normCity(city: any) {
  const { keyFactionLinks, countryId, ...rest } = city
  return {
    ...rest,
    type: 'city' as const,
    parentId: countryId,
    keyFactionIds: (keyFactionLinks ?? []).map((l: any) => l.factionId),
  }
}

function normNPC(npc: any) {
  const { factionLinks, poiId, ...rest } = npc
  return {
    ...rest,
    type: 'npc' as const,
    parentId: poiId,
    factionIds: (factionLinks ?? []).map((l: any) => l.factionId),
  }
}

export class EntityService {
  constructor(private readonly repo: EntityRepository) {}

  async getEntity(type: EntityType, id: string) {
    switch (type) {
      case 'country': {
        const e = await this.repo.findCountryById(id)
        if (!e) throw new NotFoundError(`Country ${id} not found`)
        return { ...e, type: 'country' as const, parentId: e.worldId }
      }
      case 'city': {
        const e = await this.repo.findCityById(id)
        if (!e) throw new NotFoundError(`City ${id} not found`)
        return normCity(e)
      }
      case 'poi': {
        const e = await this.repo.findPOIById(id)
        if (!e) throw new NotFoundError(`POI ${id} not found`)
        return { ...e, type: 'poi' as const, parentId: e.cityId }
      }
      case 'npc': {
        const e = await this.repo.findNPCById(id)
        if (!e) throw new NotFoundError(`NPC ${id} not found`)
        return normNPC(e)
      }
    }
  }

  async getChildren(parentType: string, parentId: string, childType: EntityType) {
    switch (childType) {
      case 'country': {
        if (parentType !== 'world') throw new BadRequestError('Countries are children of worlds')
        const list = await this.repo.findCountriesByWorldId(parentId)
        return list.map((e) => ({ ...e, type: 'country' as const, parentId: e.worldId }))
      }
      case 'city': {
        if (parentType !== 'country') throw new BadRequestError('Cities are children of countries')
        const list = await this.repo.findCitiesByCountryId(parentId)
        return list.map(normCity)
      }
      case 'poi': {
        if (parentType !== 'city') throw new BadRequestError('POIs are children of cities')
        const list = await this.repo.findPOIsByCityId(parentId)
        return list.map((e) => ({ ...e, type: 'poi' as const, parentId: e.cityId }))
      }
      case 'npc': {
        if (parentType !== 'poi') throw new BadRequestError('NPCs are children of POIs')
        const list = await this.repo.findNPCsByPOIId(parentId)
        return list.map(normNPC)
      }
    }
  }

  async createEntity(type: EntityType, data: any) {
    switch (type) {
      case 'country': {
        const input = data as CreateCountryInput
        const e = await this.repo.createCountry(input)
        return { ...e, type: 'country' as const, parentId: e.worldId }
      }
      case 'city': {
        const input = data as CreateCityInput
        const e = await this.repo.createCity(input)
        return normCity(e)
      }
      case 'poi': {
        const input = data as CreatePOIInput
        const e = await this.repo.createPOI(input)
        return { ...e, type: 'poi' as const, parentId: e.cityId }
      }
      case 'npc': {
        const input = data as CreateNPCInput
        const e = await this.repo.createNPC(input)
        return normNPC(e)
      }
    }
  }

  async updateEntity(type: EntityType, id: string, data: any) {
    // Verify existence first
    await this.getEntity(type, id)

    switch (type) {
      case 'country': {
        const input = data as UpdateCountryInput
        const e = await this.repo.updateCountry(id, input)
        return { ...e, type: 'country' as const, parentId: e.worldId }
      }
      case 'city': {
        const input = data as UpdateCityInput
        const e = await this.repo.updateCity(id, input)
        return normCity(e)
      }
      case 'poi': {
        const input = data as UpdatePOIInput
        const e = await this.repo.updatePOI(id, input)
        return { ...e, type: 'poi' as const, parentId: e.cityId }
      }
      case 'npc': {
        const input = data as UpdateNPCInput
        const e = await this.repo.updateNPC(id, input)
        return normNPC(e)
      }
    }
  }

  async deleteEntity(type: EntityType, id: string) {
    await this.getEntity(type, id)
    switch (type) {
      case 'country': return this.repo.deleteCountry(id)
      case 'city': return this.repo.deleteCity(id)
      case 'poi': return this.repo.deletePOI(id)
      case 'npc': return this.repo.deleteNPC(id)
    }
  }
}
