import { z } from "zod"

export const transactionSchema = z.object({
  categoryId: z.string().min(1, "Sélectionne une catégorie"),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  description: z.string().optional(),
  transactionDate: z.date(),
})

export type TransactionInput = z.infer<typeof transactionSchema>