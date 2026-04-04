import { z } from 'zod'

export const AddPinSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
})

export type AddPinInput = z.infer<typeof AddPinSchema>
