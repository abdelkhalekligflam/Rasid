"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Bell, Check, CircleAlert, Target, TriangleAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageSkeleton } from "@/components/shared/page-skeleton"

type Alert = {
  id: string
  type: "threshold_warning" | "over_budget" | "goal_reached"
  message: string
  is_read: boolean
  created_at: string
}

const alertStyles = {
  threshold_warning: { icon: TriangleAlert, color: "text-amber-600", background: "bg-amber-500/10" },
  over_budget: { icon: CircleAlert, color: "text-destructive", background: "bg-destructive/10" },
  goal_reached: { icon: Target, color: "text-primary", background: "bg-primary/10" },
}

export default function AlertsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { data: alerts, isLoading, error } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, type, message, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(100)
      if (error) throw error
      return data as Alert[]
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold">Alertes</h1>
        <p className="text-sm text-muted-foreground">
          Suis tes budgets et tes objectifs d&apos;épargne
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-4"><PageSkeleton /></div>}
          {error && (
            <p role="alert" className="p-6 text-sm text-destructive">
              Impossible de charger les alertes. Réessaie plus tard.
            </p>
          )}
          {!isLoading && !error && alerts?.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <Bell className="size-6" aria-hidden="true" />
              <p className="text-sm">Aucune alerte pour l&apos;instant.</p>
            </div>
          )}
          {alerts?.map((alert) => {
            const style = alertStyles[alert.type]
            const Icon = style.icon
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-4 border-b px-5 py-4 last:border-b-0 ${alert.is_read ? "" : "bg-primary/5"}`}
              >
                <div className={`rounded-xl p-2 ${style.background} ${style.color}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={alert.is_read ? "text-sm" : "text-sm font-semibold"}>{alert.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(alert.created_at), "d MMM yyyy, HH:mm", { locale: fr })}
                  </p>
                </div>
                {!alert.is_read && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="Marquer cette alerte comme lue"
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(alert.id)}
                  >
                    <Check aria-hidden="true" />
                    <span className="hidden sm:inline">Marquer comme lue</span>
                  </Button>
                )}
              </div>
            )
          })}
          {markRead.isError && (
            <p role="alert" className="px-5 pb-4 text-sm text-destructive">
              Impossible de marquer l&apos;alerte comme lue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
