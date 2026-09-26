"use client"

import Link from "next/link"
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
  { title: "Vue d'ensemble", url: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", url: "/dashboard/transactions", icon: ArrowLeftRight },
  { title: "Budgets", url: "/dashboard/budgets", icon: Wallet },
  { title: "Objectifs", url: "/dashboard/goals", icon: Target },
  { title: "Alertes", url: "/dashboard/alerts", icon: Bell },
  { title: "Catégories", url: "/dashboard/categories", icon: Tags },
  { title: "Paramètres", url: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
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
    <Sidebar>
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
                      <span>{item.title}</span>
                      {item.url === "/dashboard/alerts" && !!unreadCount && (
                        <span className="ml-auto rounded-full bg-foreground px-2 py-0.5 text-xs font-semibold text-background" aria-label={`${unreadCount} alertes non lues`}>
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
