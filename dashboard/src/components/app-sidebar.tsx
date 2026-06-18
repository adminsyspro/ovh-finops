import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, FolderTree, PieChart, GitCompare, TrendingUp,
  Activity, Server, Receipt,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar"
import { useLanguage } from "@/context/LanguageProvider"
import { Logo } from "@/components/Logo"

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

const GROUPS: { id: string; labelKey: string }[] = [
  { id: "main", labelKey: "general" },
  { id: "costs", labelKey: "costsGroup" },
  { id: "ops", labelKey: "opsGroup" },
]

/** Active-route match: exact for "/", prefix for the rest (so /projects/:id matches "Projets"). */
export function matchNav(pathname: string) {
  return NAV_ITEMS.find((i) =>
    i.path === "/" ? pathname === "/" : pathname === i.path || pathname.startsWith(i.path + "/"),
  )
}

export function AppSidebar() {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const active = matchNav(pathname)
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <Logo className="h-8 w-auto text-primary" />
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((g) => (
          <SidebarGroup key={g.id}>
            <SidebarGroupLabel>{t(g.labelKey)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.filter((i) => i.group === g.id).map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active?.path === item.path}>
                      <Link to={item.path} onClick={() => setOpenMobile(false)}>
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
