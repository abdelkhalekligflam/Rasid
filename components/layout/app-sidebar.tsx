"use client"

import Link from "next/link"
import { useT, useLocale } from "@/components/locale-provider"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Bell,
  Tags,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", url: "/dashboard/transactions", icon: ArrowLeftRight },
  { title: "Budgets", url: "/dashboard/budgets", icon: Wallet },
  { title: "Goals", url: "/dashboard/goals", icon: Target },
  { title: "Alerts", url: "/dashboard/alerts", icon: Bell },
  { title: "Categories", url: "/dashboard/categories", icon: Tags },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const t = useT()
  const locale = useLocale()
  const supabase = createClient()
  const { data: unreadCount } = useQuery({
    queryKey: ["unread-alert-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
      if (error) throw error
      return count ?? 0
    },
  })

  return (
    <Sidebar side={locale === "ar" ? "right" : "left"}>
      <SidebarHeader className="border-b px-5 py-5">
        <span className="text-lg font-heading font-semibold tracking-[-0.04em] text-foreground">
          rasid<span className="text-emerald-500">.</span>
        </span>
      </SidebarHeader>
      <SidebarContent className="px-2 py-5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                      {item.url === "/dashboard/alerts" && !!unreadCount && (
                        <span className="ms-auto rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background" aria-label={`${unreadCount} ${t("Alerts")}`}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
