"use client"

import { useLocale } from "@/components/locale-provider"
import { translateLegacy } from "@/lib/i18n"
import { useEffect, useState } from "react"
import { CircleCheck, CircleAlert, X } from "lucide-react"

type Notice = { id: number; message: string; error: boolean }
const eventName = "rasid:notice"

export function notify(message: string, error = false) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: { message, error } }))
}

export function ToastViewport() {
  const locale = useLocale()
  const [notices, setNotices] = useState<Notice[]>([])
  useEffect(() => {
    const handler = (event: Event) => {
      const { message, error } = (event as CustomEvent<{ message: string; error: boolean }>).detail
      const id = Date.now() + Math.random()
      setNotices((current) => [...current, { id, message, error }].slice(-3))
      window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 4500)
    }
    window.addEventListener(eventName, handler)
    return () => window.removeEventListener(eventName, handler)
  }, [])
  return <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed bottom-5 right-5 rtl:left-5 rtl:right-auto z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
    {notices.map((notice) => <div key={notice.id} role={notice.error ? "alert" : "status"} className="pointer-events-auto flex items-center gap-3 rounded-lg border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg">
      {notice.error ? <CircleAlert className="size-4 shrink-0 text-destructive" /> : <CircleCheck className="size-4 shrink-0 text-emerald-500" />}
      <span className="flex-1">{translateLegacy(locale, notice.message)}</span>
      <button type="button" aria-label={locale === "ar" ? "إغلاق الإشعار" : locale === "fr" ? "Fermer la notification" : "Dismiss notification"} onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))}><X className="size-4 text-muted-foreground" /></button>
    </div>)}
  </div>
}
