import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/LanguageProvider"

export function KpiCard({
  label, value, sublabel, delta, accent, deltaLabel,
}: {
  label: string
  value: string
  sublabel?: string
  delta?: number | null
  accent?: boolean
  deltaLabel?: string
}) {
  const { t } = useLanguage()
  const resolvedSuffix = deltaLabel !== undefined ? deltaLabel : t("vsPreviousMonth")
  const hasDelta = delta !== undefined
  const positive = typeof delta === "number" && delta > 0
  const negative = typeof delta === "number" && delta < 0

  return (
    <Card className={cn("overflow-hidden", accent && "border-primary/25 bg-primary/[0.035]")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
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
        <p className="mt-3 text-2xl font-semibold leading-none">{value}</p>
        <div className="mt-3 min-h-5 text-xs text-muted-foreground">
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
