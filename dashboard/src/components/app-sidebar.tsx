import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, FolderTree, PieChart, GitCompare, TrendingUp,
  Activity, Server, Receipt,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/context/LanguageProvider"

export const NAV_ITEMS = [
  { titleKey: "overview", path: "/", icon: LayoutDashboard, group: "main" },
  { titleKey: "projects", path: "/projects", icon: FolderTree, group: "costs" },
  { titleKey: "byService", path: "/costs/services", icon: PieChart, group: "costs" },
  { titleKey: "compare", path: "/compare", icon: GitCompare, group: "costs" },
  { titleKey: "trends", path: "/trends", icon: TrendingUp, group: "costs" },
  { titleKey: "consumption", path: "/consumption", icon: Activity, group: "ops" },
  { titleKey: "inventory", path: "/inventory", icon: Server, group: "ops" },
  { titleKey: "billing", path: "/bills", icon: Receipt, group: "ops" },
] as const

export function AppSidebar() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const groups: { id: string; labelKey: string }[] = [
    { id: "main", labelKey: "general" },
    { id: "costs", labelKey: "costsGroup" },
    { id: "ops", labelKey: "opsGroup" },
  ]
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <img src="/logo.png" alt="ovh-finops" className="h-8 object-contain" />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.id}>
            <SidebarGroupLabel>{t(g.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.filter((i) => i.group === g.id).map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={pathname === item.path}>
                      <Link to={item.path}>
                        <item.icon />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
