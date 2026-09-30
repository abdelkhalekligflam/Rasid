import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { LanguageSelect } from "@/components/locale-provider"
import { getT } from "@/lib/i18n-server"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getT()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_image")
    .eq("id", user.id)
    .single()

  const initials = (profile?.full_name || user.email || "?")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between h-16 px-5 sm:px-8 border-b bg-background sticky top-0 z-10">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
          <LanguageSelect />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label={t("Account")} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_image ?? undefined} alt={t("Profile photo")} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="w-full text-start">
                    {t("Sign out")}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </SidebarProvider>
  )
}
