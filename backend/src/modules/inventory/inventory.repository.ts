import { PrismaClient } from '@prisma/client'
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  ReplaceInventoryInput,
} from './inventory.schemas'

export class InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPoiId(poiId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { poiId },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findById(id: string) {
    return this.prisma.inventoryItem.findUnique({ where: { id } })
  }

  async create(poiId: string, data: CreateInventoryItemInput) {
    const maxOrder = await this.prisma.inventoryItem.aggregate({
      where: { poiId },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1
    return this.prisma.inventoryItem.create({ data: { ...data, poiId, sortOrder } })
  }

  async update(id: string, data: UpdateInventoryItemInput) {
    return this.prisma.inventoryItem.update({ where: { id }, data })
  }

  async delete(id: string) {
    return this.prisma.inventoryItem.delete({ where: { id } })
  }

  async reorder(poiId: string, orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.inventoryItem.update({
          where: { id, poiId },
          data: { sortOrder: index },
        }),
      ),
    )
  }

  async replace(poiId: string, data: ReplaceInventoryInput) {
    await this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.deleteMany({ where: { poiId } })
      await tx.inventoryItem.createMany({
        data: data.items.map((item, index) => ({
          ...item,
          poiId,
          sortOrder: index,
        })),
      })
    })
    return this.findByPoiId(poiId)
  }
}
