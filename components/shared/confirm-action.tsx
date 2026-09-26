"use client"

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
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm rounded-xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter className="mt-3 gap-2 sm:gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Annuler</Button>
        <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>{pending ? "Patiente..." : action}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
