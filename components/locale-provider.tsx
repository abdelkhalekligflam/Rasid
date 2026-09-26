"use client"
import { createContext, useContext, useEffect, type ReactNode } from "react"
import { type Locale, translate, localeNames } from "@/lib/i18n"

const LocaleContext = createContext<Locale>("en")
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = locale === "ar" ? "rtl" : "ltr" }, [locale])
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}
export function useLocale() { return useContext(LocaleContext) }
export function useT() { const locale = useLocale(); return (key: string) => translate(locale, key) }
export function LanguageSelect({ className = "" }: { className?: string }) {
  const locale = useLocale()
  return <select aria-label={translate(locale, "Language")} value={locale} className={`h-9 rounded-md border bg-background px-2 text-xs font-medium text-foreground ${className}`} onChange={(event) => {
    const next = event.target.value as Locale
    document.cookie = `rasid_locale=${next}; path=/; max-age=31536000; SameSite=Lax`
    document.documentElement.lang = next
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr"
    window.location.reload()
  }}>{(Object.keys(localeNames) as Locale[]).map((item) => <option key={item} value={item}>{localeNames[item]}</option>)}</select>
}
