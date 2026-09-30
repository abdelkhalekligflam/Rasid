"use client"

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { refreshDashboard } from "@/app/actions/refresh-dashboard"

export function useRefreshDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useCallback(async () => {
    void queryClient.invalidateQueries({ queryKey: ["alerts"] })
    void queryClient.invalidateQueries({ queryKey: ["unread-alert-count"] })
    try {
      await refreshDashboard()
    } catch {
      // The data mutation already succeeded; a failed refresh must not report it as failed.
      router.refresh()
    }
  }, [router, queryClient])
}
