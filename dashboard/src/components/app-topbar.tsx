import { useLocation } from "react-router-dom"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { NAV_ITEMS } from "@/components/app-sidebar"
import { useLanguage } from "@/context/LanguageProvider"

export function AppTopbar() {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const current = NAV_ITEMS.find((i) => i.path === pathname)
  return (
    <header className="flex h-14 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-5" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{current ? t(current.titleKey) : "ovh-finops"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
