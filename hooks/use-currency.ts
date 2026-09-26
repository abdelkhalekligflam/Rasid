"use client"

import { useLocale } from "@/components/locale-provider"
import { localeTags } from "@/lib/i18n"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useCurrency() {
  const supabase = createClient()
  const locale = useLocale()
  const { data } = useQuery({
    queryKey: ["profile-currency"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Session expirée.")
      const { data, error } = await supabase.from("profiles")
        .select("currency").eq("id", user.id).single()
      if (error) throw error
      return data.currency as string
    },
  })
  return (amount: number) => data
    ? new Intl.NumberFormat(localeTags[locale], {
      style: "currency", currency: data, minimumFractionDigits: 2,
    }).format(amount)
    : "—"
}
