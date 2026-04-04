import { z } from 'zod'

export const CreateWorldSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  climate: z.string().optional(),
  magicLevel: z.string().optional(),
})

export const UpdateWorldSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  climate: z.string().optional(),
  magicLevel: z.string().optional(),
})

export type CreateWorldInput = z.infer<typeof CreateWorldSchema>
export type UpdateWorldInput = z.infer<typeof UpdateWorldSchema>
