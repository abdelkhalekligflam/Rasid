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
      <SidebarHeader className="px-4 py-4">
        <span className="text-xl font-heading font-semibold text-primary">
          Rasid
        </span>
      </SidebarHeader>
      <SidebarContent>
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
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground" aria-label={`${unreadCount} alertes non lues`}>
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
