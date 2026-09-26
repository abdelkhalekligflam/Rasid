import { cookies } from "next/headers"
import { type Locale, translate } from "@/lib/i18n"

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("rasid_locale")?.value
  return value === "fr" || value === "ar" ? value : "en"
}
export async function getT() {
  const locale = await getLocale()
  return (key: string) => translate(locale, key)
}
