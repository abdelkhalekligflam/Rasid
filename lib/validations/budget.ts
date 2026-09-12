import { z } from "zod"

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Sélectionne une catégorie"),
  amountLimit: z.coerce.number().positive("Le plafond doit être positif"),
  recurrence: z.enum(["weekly", "monthly", "yearly"]),
})

export type BudgetInput = z.infer<typeof budgetSchema>