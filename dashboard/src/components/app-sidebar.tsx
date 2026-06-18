import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard, FolderTree, PieChart, GitCompare, TrendingUp,
  HardDrive, Server, Receipt, User, Users,
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
  { titleKey: "inventory", path: "/inventory", icon: Server, group: "ops" },
  { titleKey: "bareMetal", path: "/bare-metal", icon: HardDrive, group: "ops" },
  { titleKey: "billing", path: "/bills", icon: Receipt, group: "ops" },
  { titleKey: "profile", path: "/profile", icon: User, group: "account" },
  { titleKey: "users", path: "/users", icon: Users, group: "account" },
] as const

const GROUPS: { id: string; labelKey: string }[] = [
  { id: "main", labelKey: "general" },
  { id: "costs", labelKey: "costsGroup" },
  { id: "ops", labelKey: "opsGroup" },
  { id: "account", labelKey: "accountGroup" },
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
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-background/70 p-2 shadow-xs">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Logo className="h-5 w-auto" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold leading-5">{t("appTitle")}</p>
            <p className="truncate text-xs text-muted-foreground">OVHcloud</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1 pb-2">
        {GROUPS.map((g) => (
          <SidebarGroup key={g.id} className="py-1">
            <SidebarGroupLabel className="h-7 px-2 text-xs font-semibold text-sidebar-foreground/55">
              {t(g.labelKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.filter((i) => i.group === g.id).map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={active?.path === item.path}
                      tooltip={t(item.titleKey)}
                      className="h-9 rounded-md px-2.5 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-xs"
                    >
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
