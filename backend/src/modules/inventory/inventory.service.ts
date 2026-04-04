import { InventoryRepository } from './inventory.repository'
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ReorderInventoryInput,
  ReplaceInventoryInput,
} from './inventory.schemas'
import { NotFoundError } from '../../lib/errors'

export class InventoryService {
  constructor(private readonly repo: InventoryRepository) {}

  async listItems(poiId: string) {
    return this.repo.findByPoiId(poiId)
  }

  async addItem(poiId: string, data: CreateInventoryItemInput) {
    return this.repo.create(poiId, data)
  }

  async updateItem(id: string, data: UpdateInventoryItemInput) {
    const item = await this.repo.findById(id)
    if (!item) throw new NotFoundError(`Inventory item ${id} not found`)
    return this.repo.update(id, data)
  }

  async deleteItem(id: string) {
    const item = await this.repo.findById(id)
    if (!item) throw new NotFoundError(`Inventory item ${id} not found`)
    return this.repo.delete(id)
  }

  async reorder(poiId: string, data: ReorderInventoryInput) {
    await this.repo.reorder(poiId, data.orderedIds)
    return this.repo.findByPoiId(poiId)
  }

  async replace(poiId: string, data: ReplaceInventoryInput) {
    return this.repo.replace(poiId, data)
  }
}
