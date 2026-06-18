import { usePeriod } from "@/context/PeriodContext"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useConsumptionCurrent,
  useConsumptionForecast,
  useConsumptionHistory,
} from "@/hooks/queries"
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
  const { from, to } = usePeriod()

  const current = useConsumptionCurrent()
  const forecast = useConsumptionForecast()
  const history = useConsumptionHistory(from, to)

  if (current.isLoading || forecast.isLoading) {
    return <ConsumptionSkeleton />
  }

  if (current.isError || forecast.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

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
  let forecastSublabel: string
  if (forecastData?.days_elapsed != null) {
    forecastSublabel = `${forecastData.days_elapsed}/${forecastData.days_in_month ?? "?"} ${t("days")}`
  } else {
    forecastSublabel = t("forecastEndOfMonth")
  }

  // Aggregate history data by period_start
  const historyRows = history.data ?? []
  const aggregated = new Map<string, number>()
  for (const row of historyRows) {
    const key = row.period_start
    aggregated.set(key, (aggregated.get(key) ?? 0) + row.total)
  }
  const historyChartData = Array.from(aggregated.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period_start, cost]) => ({
      label: period_start.slice(0, 7),
      cost,
    }))

  return (
    <div className="space-y-6">
      {/* Two KPI cards: current + forecast */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Current consumption card */}
        <div className="rounded-xl border border-l-4 border-l-primary bg-card p-5 shadow-sm space-y-2">
          <p className="text-sm text-muted-foreground">{t("currentConsumption")}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(currentTotal, language, currentCurrency)}
          </p>
          <ProgressBar pct={progressPct} />
          <p className="text-xs text-muted-foreground">{currentSublabel}</p>
        </div>

        {/* Forecast card */}
        <div className="rounded-xl border border-l-4 border-l-primary bg-card p-5 shadow-sm space-y-2">
          <p className="text-sm text-muted-foreground">{t("forecastEndOfMonth")}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {formatMoney(forecastTotal, language, forecastCurrency)}
          </p>
          <ProgressBar pct={Math.min(forecastData?.progress ?? 0, 100)} />
          <p className="text-xs text-muted-foreground">{forecastSublabel}</p>
        </div>
      </div>

      {/* Usage history */}
      <SectionCard title={t("consumptionHistory")}>
        <TrendLineChart data={historyChartData} />
      </SectionCard>
    </div>
  )
}
