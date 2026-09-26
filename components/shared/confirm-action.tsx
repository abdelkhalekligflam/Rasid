"use client"

import { useLocale } from "@/components/locale-provider"
import { translateLegacy } from "@/lib/i18n"
import { useT } from "@/components/locale-provider"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ConfirmAction({ open, onOpenChange, title, description, action, pending, onConfirm, destructive = false }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  action: string
  pending: boolean
  onConfirm: () => void
  destructive?: boolean
}) {
  const t = useT()
  const locale = useLocale()
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm rounded-xl">
      <DialogHeader>
        <DialogTitle>{translateLegacy(locale, title)}</DialogTitle>
        <DialogDescription>{translateLegacy(locale, description)}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-3 gap-2 sm:gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>{t('Cancel')}</Button>
        <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>{pending ? t("Please wait...") : translateLegacy(locale, action)}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
