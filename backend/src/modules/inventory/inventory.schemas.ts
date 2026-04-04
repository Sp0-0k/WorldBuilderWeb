import { z } from 'zod'

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().min(0).default(1),
  weight: z.number().optional(),
  value: z.number().optional(),
})

export const UpdateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  weight: z.number().optional(),
  value: z.number().optional(),
})

export const ReorderInventorySchema = z.object({
  orderedIds: z.array(z.string()),
})

export const ReplaceInventorySchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().int().min(0).default(1),
      weight: z.number().optional(),
      value: z.number().optional(),
    }),
  ),
})

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>
export type UpdateInventoryItemInput = z.infer<typeof UpdateInventoryItemSchema>
export type ReorderInventoryInput = z.infer<typeof ReorderInventorySchema>
export type ReplaceInventoryInput = z.infer<typeof ReplaceInventorySchema>
