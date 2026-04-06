import { z } from 'zod'

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().default(''),
  rarity: z.string().default('Common'),
})

export const UpdateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  rarity: z.string().optional(),
})

export const ReorderInventorySchema = z.object({
  orderedIds: z.array(z.string()),
})

export const ReplaceInventorySchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.string().default(''),
      rarity: z.string().default('Common'),
    }),
  ),
})

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>
export type ReorderInventoryInput = z.infer<typeof ReorderInventorySchema>
export type ReplaceInventoryInput = z.infer<typeof ReplaceInventorySchema>
