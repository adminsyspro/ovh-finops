import { SectionCard } from "@/components/SectionCard"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/context/LanguageProvider"
import { cn } from "@/lib/utils"
import type { ExpiringService } from "@/services/api"

export function daysUntil(dateStr: string, now: Date = new Date()): number {
  return Math.ceil((new Date(dateStr).getTime() - now.getTime()) / 86_400_000)
}

function typeKey(type: string): string {
  if (type === "dedicated_server") return "dedicatedServers"
  if (type === "vps") return "vpsInstances"
  return "storageServices"
}

export function ExpiringAlerts({ services }: { services: ExpiringService[] }) {
  const { t } = useLanguage()
  const sorted = [...services].sort((a, b) => a.expiration_date.localeCompare(b.expiration_date))
  return (
    <SectionCard title={t("expiringSoon")}>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noExpirations")}</p>
      ) : (
        <ul className="divide-y">
          {sorted.slice(0, 5).map((s) => {
            const left = daysUntil(s.expiration_date)
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline">{t(typeKey(s.type))}</Badge>
                  <span className="truncate text-sm">{s.display_name || s.id}</span>
                </div>
                <span className={cn("shrink-0 text-sm", left <= 7 ? "text-red-600" : "text-orange-600")}>
                  {left < 0 ? t("expired") : `${t("expiringIn")} ${left} ${t("days")}`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
