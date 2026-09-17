import { z } from "zod"

export const goalSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  targetAmount: z.coerce.number().positive("Le montant cible doit être positif"),
  targetDate: z.date().optional(),
})

export type GoalInput = z.infer<typeof goalSchema>