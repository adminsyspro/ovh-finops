import { useLocation } from "react-router-dom"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { MonthPicker } from "@/components/MonthPicker"
import { matchNav } from "@/components/app-sidebar"
import { useLanguage } from "@/context/LanguageProvider"

const PAGE_DESCRIPTIONS: Record<string, string> = {
  overview: "overviewDescription",
  projects: "projectsDescription",
  byService: "servicesDescription",
  compare: "compareDescription",
  trends: "trendsDescription",
  consumption: "consumptionDescription",
  inventory: "inventoryDescription",
  billing: "billingDescription",
}

export function AppTopbar() {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const current = matchNav(pathname)
  const title = current ? t(current.titleKey) : "OVH FinOps"
  const description = current ? t(PAGE_DESCRIPTIONS[current.titleKey] ?? "appSubtitle") : t("appSubtitle")

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
      <div className="flex min-h-12 items-center gap-3">
        <SidebarTrigger className="size-8" />
        <Separator orientation="vertical" className="hidden h-6 md:block" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-base font-semibold">{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Badge variant="secondary" className="hidden h-6 rounded-md px-2 text-xs font-medium sm:inline-flex">
              OVHcloud
            </Badge>
          </div>
          <p className="mt-1 hidden truncate text-sm text-muted-foreground md:block">{description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <MonthPicker />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
