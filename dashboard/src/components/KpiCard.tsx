import { Card, CardContent } from "@/components/ui/card"
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
  return (
    <Card className={cn(accent && "border-l-4 border-l-primary")}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
        {delta !== undefined && (
          delta === null ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("noPreviousData")}</p>
          ) : (
            <p
              className={cn(
                "mt-2 text-sm",
                delta > 0 ? "text-red-500" : delta < 0 ? "text-green-500" : "text-muted-foreground",
              )}
            >
              {delta > 0 ? "+" : ""}{delta.toFixed(1)}%{resolvedSuffix ? ` ${resolvedSuffix}` : ""}
            </p>
          )
        )}
      </CardContent>
    </Card>
  )
}
