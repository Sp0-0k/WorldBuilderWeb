import { z } from 'zod'

export const EntityTypeSchema = z.enum(['world', 'country', 'city', 'poi', 'npc'])
export type EntityType = z.infer<typeof EntityTypeSchema>

export const CreateCountrySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().min(1),
  governmentType: z.string().optional(),
  economy: z.string().optional(),
  populationSize: z.string().optional(),
})

export const UpdateCountrySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  governmentType: z.string().optional(),
  economy: z.string().optional(),
  populationSize: z.string().optional(),
})

export const CreateCitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().min(1),
  populationSize: z.string().optional(),
  mainExport: z.string().optional(),
})

export const UpdateCitySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  populationSize: z.string().optional(),
  mainExport: z.string().optional(),
})

export const CreatePOISchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().min(1),
  dangerLevel: z.string().optional(),
  keyFeature: z.string().optional(),
  inventoryEnabled: z.boolean().optional(),
})

export const UpdatePOISchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  dangerLevel: z.string().optional(),
  keyFeature: z.string().optional(),
  inventoryEnabled: z.boolean().optional(),
})

export const CreateNPCSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().min(1),
  role: z.string().optional(),
  alignment: z.string().optional(),
  race: z.string().optional(),
  personality: z.string().optional(),
})

export const UpdateNPCSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  role: z.string().optional(),
  alignment: z.string().optional(),
  race: z.string().optional(),
  personality: z.string().optional(),
})

export type CreateCountryInput = z.infer<typeof CreateCountrySchema>
export type UpdateCountryInput = z.infer<typeof UpdateCountrySchema>
export type CreateCityInput = z.infer<typeof CreateCitySchema>
export type UpdateCityInput = z.infer<typeof UpdateCitySchema>
export type CreatePOIInput = z.infer<typeof CreatePOISchema>
export type UpdatePOIInput = z.infer<typeof UpdatePOISchema>
export type CreateNPCInput = z.infer<typeof CreateNPCSchema>
export type UpdateNPCInput = z.infer<typeof UpdateNPCSchema>
