import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/LanguageProvider"
import { type Icon as PhosphorIcon } from "@phosphor-icons/react"

export function KpiCard({
  label, value, sublabel, delta, accent, deltaLabel, icon: Icon,
}: {
  label: string
  value: string
  sublabel?: string
  delta?: number | null
  accent?: boolean
  deltaLabel?: string
  icon?: PhosphorIcon
}) {
  const { t } = useLanguage()
  const resolvedSuffix = deltaLabel !== undefined ? deltaLabel : t("vsPreviousMonth")
  const hasDelta = delta !== undefined
  const positive = typeof delta === "number" && delta > 0
  const negative = typeof delta === "number" && delta < 0

  return (
    <Card className={cn("overflow-hidden", accent && "border-primary/25 bg-primary/[0.035]")}>
      <CardContent className="relative min-h-28 overflow-hidden p-5">
        {Icon && (
          <Icon
            weight="duotone"
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 size-24 -translate-y-1/2 text-muted-foreground/15",
              accent && "text-primary/20",
            )}
            aria-hidden="true"
          />
        )}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <p className="min-w-0 pr-12 text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex shrink-0 items-center gap-2">
            {hasDelta && delta !== null && (
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-md px-1.5 text-[11px]",
                  positive && "bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300",
                  negative && "bg-emerald-50 text-green-500 dark:bg-emerald-500/15 dark:text-emerald-300",
                )}
              >
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
        <p className="relative z-10 mt-3 pr-10 text-2xl font-semibold leading-none">{value}</p>
        <div className="relative z-10 mt-3 min-h-5 pr-10 text-xs text-muted-foreground">
          {sublabel && <p>{sublabel}</p>}
          {delta !== undefined && (
            delta === null ? (
              <p>{t("noPreviousData")}</p>
            ) : (
              <p>{resolvedSuffix}</p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
