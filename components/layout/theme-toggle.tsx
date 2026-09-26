"use client"

import { useT } from "@/components/locale-provider"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const t = useT()
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={t("Switch theme")}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  )
}
