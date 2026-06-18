import { useLanguage } from "@/context/LanguageProvider"
import {
  useConsumptionCurrent,
  useConsumptionForecast,
  useConsumptionHistory,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { SectionCard } from "@/components/SectionCard"
import { TrendLineChart } from "@/components/charts/TrendLineChart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full bg-muted">
      <div
        data-testid="consumption-progress"
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

function ConsumptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-[320px] w-full" />
    </div>
  )
}

export function Consumption() {
  const { t, language } = useLanguage()
  const { monthsQuery, months, selected, from, to } = useSelectedMonth()

  const current = useConsumptionCurrent(from, to)
  const forecast = useConsumptionForecast(from, to)
  const history = useConsumptionHistory(from, to)

  if (monthsQuery.isLoading || current.isLoading || forecast.isLoading) {
    return <ConsumptionSkeleton />
  }

  if (monthsQuery.isError || current.isError || forecast.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  if (months.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        {t("noDataAvailable")}
      </div>
    )
  }

  if (!selected) return <ConsumptionSkeleton />

  const currentData = current.data
  const forecastData = forecast.data

  const currentTotal = currentData?.current_total ?? 0
  const currentCurrency = currentData?.currency ?? "EUR"
  const forecastTotal = forecastData?.forecast_total ?? 0
  const forecastCurrency = forecastData?.currency ?? "EUR"
  const progressPct = forecastData?.progress ?? 0

  // Compute current sublabel
  let currentSublabel: string
  if (currentData?.source === "cloud_projects") {
    currentSublabel = `Public Cloud${currentData.project_count != null ? ` · ${currentData.project_count} ${t("cloudProjects")}` : ""}`
  } else if (currentData?.period_start && currentData?.period_end) {
    currentSublabel = `${currentData.period_start} → ${currentData.period_end}`
  } else {
    currentSublabel = t("forecastEndOfMonth")
  }

  // Compute forecast sublabel
  const forecastIsSelectedPeriod = forecastData?.source === "selected_period"
  let forecastSublabel: string
  if (forecastIsSelectedPeriod && forecastData?.period_start && forecastData?.period_end) {
    forecastSublabel = `${forecastData.period_start} → ${forecastData.period_end}`
  } else if (forecastData?.days_elapsed != null) {
    forecastSublabel = `${forecastData.days_elapsed}/${forecastData.days_in_month ?? "?"} ${t("days")}`
  } else {
    forecastSublabel = t("forecastEndOfMonth")
  }

  // Aggregate history data by period_start
  const historyRows = history.data ?? []
  const aggregated = new Map<string, number>()
  for (const row of historyRows) {
    const key = row.period_start.slice(0, 7)
    aggregated.set(key, (aggregated.get(key) ?? 0) + row.total)
  }
  const historyChartData = Array.from(aggregated.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, cost]) => ({
      label,
      cost,
    }))

  return (
    <div className="space-y-6">
      {/* Two KPI cards: current + forecast */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Current consumption card */}
        <div className="space-y-2 rounded-lg border border-l-4 border-l-primary bg-card p-5 shadow-xs">
          <p className="text-sm text-muted-foreground">{t("currentConsumption")}</p>
          <p className="text-2xl font-semibold">
            {formatMoney(currentTotal, language, currentCurrency)}
          </p>
          <ProgressBar pct={progressPct} />
          <p className="text-xs text-muted-foreground">{currentSublabel}</p>
        </div>

        {/* Forecast card */}
        <div className="space-y-2 rounded-lg border border-l-4 border-l-primary bg-card p-5 shadow-xs">
          <p className="text-sm text-muted-foreground">
            {forecastIsSelectedPeriod ? t("selectedPeriod") : t("forecastEndOfMonth")}
          </p>
          <p className="text-2xl font-semibold">
            {formatMoney(forecastTotal, language, forecastCurrency)}
          </p>
          <ProgressBar pct={Math.min(forecastData?.progress ?? 0, 100)} />
          <p className="text-xs text-muted-foreground">{forecastSublabel}</p>
        </div>
      </div>

      {/* Usage history */}
      <SectionCard title={t("consumptionHistory")}>
        <TrendLineChart data={historyChartData} variant="area" />
      </SectionCard>
    </div>
  )
}
