import { PinsRepository } from './pins.repository'
import { AddPinInput } from './pins.schemas'

export class PinsService {
  constructor(private readonly repo: PinsRepository) {}

  async listPins(worldId: string) {
    const pins = await this.repo.findByWorldId(worldId)

    // Enrich each pin with entity name
    const enriched = await Promise.all(
      pins.map(async (pin) => {
        const name = await this.repo.resolveEntityName(pin.entityType, pin.entityId)
        return { ...pin, name }
      }),
    )
    return enriched
  }

  async addPin(worldId: string, data: AddPinInput) {
    const pin = await this.repo.create(worldId, data)
    const name = await this.repo.resolveEntityName(pin.entityType, pin.entityId)
    return { ...pin, name }
  }

  async removePin(worldId: string, entityId: string) {
    await this.repo.delete(worldId, entityId)
  }
}
