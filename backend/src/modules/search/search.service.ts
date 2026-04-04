import { SearchRepository } from './search.repository'
import { SearchQuery } from './search.schemas'

export class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  async search(params: SearchQuery) {
    const { worldId, q, limit } = params
    const { countries, cities, pois, npcs } = await this.repo.search(worldId, q, limit)

    const results = [
      ...countries.map((e) => ({ id: e.id, name: e.name, type: 'country', parentId: e.worldId })),
      ...cities.map((e) => ({ id: e.id, name: e.name, type: 'city', parentId: e.countryId })),
      ...pois.map((e) => ({ id: e.id, name: e.name, type: 'poi', parentId: e.cityId })),
      ...npcs.map((e) => ({ id: e.id, name: e.name, type: 'npc', parentId: e.poiId })),
    ]

    return results.slice(0, limit)
  }
}
