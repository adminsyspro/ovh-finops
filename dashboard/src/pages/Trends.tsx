import { usePeriod } from "@/context/PeriodContext"
import { useLanguage } from "@/context/LanguageProvider"
import { useMonthlyTrend, useConfig } from "@/hooks/queries"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { TrendLineChart } from "@/components/charts/TrendLineChart"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMoney, trendMonthLabel } from "@/lib/format"

const PERIOD_OPTIONS = [3, 6, 12, 24, 36] as const

function TrendsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-[320px] w-full" />
    </div>
  )
}

export function Trends() {
  const { t, language } = useLanguage()
  const { months, setMonths } = usePeriod()

  const monthly = useMonthlyTrend(months)
  const config = useConfig()

  if (monthly.isLoading) return <TrendsSkeleton />

  if (monthly.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  const monthlyData = monthly.data ?? []
  const currency = config.data?.currency ?? "EUR"

  // Map to chart-ready data using trendMonthLabel for proper labels
  const monthlyChartData = monthlyData.map((p) => ({
    label: trendMonthLabel(p.yearMonth, language),
    cost: p.cost,
  }))

  // Stat computations
  const first = monthlyData[0] ?? null
  const last = monthlyData[monthlyData.length - 1] ?? null

  const growth: number | null =
    monthlyData.length >= 2 && first && first.cost !== 0
      ? ((last!.cost - first.cost) / first.cost) * 100
      : null

  const maxPoint = monthlyData.reduce<(typeof monthlyData)[number] | null>(
    (acc, p) => (acc === null || p.cost > acc.cost ? p : acc),
    null,
  )

  const peakLabel = maxPoint ? trendMonthLabel(maxPoint.yearMonth, language) : "—"
  const peakCost = maxPoint?.cost ?? 0

  const monthKeyMap: Record<number, string> = {
    3: "months3",
    6: "months6",
    12: "months12",
    24: "months24",
    36: "months36",
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t("period")}</span>
        <Select
          value={String(months)}
          onValueChange={(v: string) => setMonths(Number(v))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {t(monthKeyMap[m])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("periodGrowth")}
          value={`${t("overLast")} ${months} ${t("lastMonths")}`}
          delta={growth}
          deltaLabel=""
        />
        <KpiCard
          label={t("mostExpensiveMonth")}
          value={peakLabel}
          sublabel={formatMoney(peakCost, language, currency)}
        />
        <KpiCard
          label={t("annualProjection")}
          value={`~${formatMoney((last?.cost ?? 0) * 12, language, currency)}`}
          sublabel={t("basedOnLastMonth")}
        />
      </div>

      {/* Monthly trend chart */}
      <SectionCard title={`${t("evolutionOver")} ${months} ${t("lastMonths")}`}>
        <TrendLineChart data={monthlyChartData} variant="area" />
      </SectionCard>
    </div>
  )
}
