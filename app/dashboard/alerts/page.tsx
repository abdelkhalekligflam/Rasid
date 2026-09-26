"use client"

import { useT } from "@/components/locale-provider"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { fr, enUS, arMA } from "date-fns/locale"
import { useLocale } from "@/components/locale-provider"
import { alertMessage } from "@/lib/i18n"
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
  goal_reached: { icon: Target, color: "text-emerald-600 dark:text-emerald-400", background: "bg-emerald-500/10" },
}

export default function AlertsPage() {
  const t = useT()
  const locale = useLocale()
  const dateLocale = locale === "ar" ? arMA : locale === "fr" ? fr : enUS
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
        <h1 className="text-2xl font-heading font-semibold">{t("Alerts")}</h1>
        <p className="text-sm text-muted-foreground">
          {t('Stay on top of your budgets and savings goals')}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-4"><PageSkeleton /></div>}
          {error && (
            <p role="alert" className="p-6 text-sm text-destructive">
              {t("Couldn't load alerts. Try again later.")}
            </p>
          )}
          {!isLoading && !error && alerts?.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <Bell className="size-6" aria-hidden="true" />
              <p className="text-sm">{t("No alerts yet.")}</p>
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
                  <p className={alert.is_read ? "text-sm" : "text-sm font-semibold"}>{alertMessage(locale, alert.type, alert.message)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(alert.created_at), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                  </p>
                </div>
                {!alert.is_read && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={t("Mark as read")}
                    disabled={markRead.isPending}
                    onClick={() => markRead.mutate(alert.id)}
                  >
                    <Check aria-hidden="true" />
                    <span className="hidden sm:inline">{t("Mark as read")}</span>
                  </Button>
                )}
              </div>
            )
          })}
          {markRead.isError && (
            <p role="alert" className="px-5 pb-4 text-sm text-destructive">
              {t("Couldn't mark the alert as read.")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
