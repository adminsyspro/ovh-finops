import { usePeriod } from "@/context/PeriodContext"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useMonths, useConfig, useSummary, useByService, useByProject, useByResourceType, useExpiring,
} from "@/hooks/queries"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { BudgetGauge } from "@/components/BudgetGauge"
import { ExpiringAlerts } from "@/components/ExpiringAlerts"
import { DonutChart } from "@/components/charts/DonutChart"
import { TopProjectsBar } from "@/components/charts/TopProjectsBar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"

export function Overview() {
  const { t, language } = useLanguage()
  const { selectedMonth } = usePeriod()

  const months = useMonths().data ?? []
  const idx = months.findIndex((m) => m.value === selectedMonth)
  const selected = idx >= 0 ? months[idx] : null
  const previous = idx >= 0 && idx < months.length - 1 ? months[idx + 1] : null

  const summary = useSummary(selected?.from, selected?.to)
  const prevSummary = useSummary(previous?.from, previous?.to)
  const byService = useByService(selected?.from, selected?.to)
  const byProject = useByProject(selected?.from, selected?.to)
  const byResourceType = useByResourceType(selected?.from, selected?.to)
  const expiring = useExpiring(30)
  const config = useConfig()

  if (!selectedMonth || summary.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
    )
  }
  if (summary.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  const s = summary.data
  const total = s?.total ?? 0
  const prevTotal = prevSummary.data?.total ?? 0
  const variation = previous && prevTotal ? ((total - prevTotal) / prevTotal) * 100 : null
  const currency = config.data?.currency ?? "EUR"
  const topProjects = (byProject.data ?? []).slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard accent label={t("totalCost")} value={formatMoney(total, language, currency)} delta={variation} />
        <KpiCard label={t("cloudTotal")} value={formatMoney(s?.cloudTotal ?? 0, language, currency)} sublabel={t("publicCloud")} />
        <KpiCard label={t("dailyAverage")} value={formatMoney(s?.dailyAverage ?? 0, language, currency)} sublabel={t("over30Days")} />
        <KpiCard label={t("activeProjects")} value={String(s?.projectsCount ?? 0)} sublabel={t("withConsumption")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("serviceBreakdown")}>
          <DonutChart data={byService.data ?? []} />
        </SectionCard>
        <SectionCard title={t("topProjects")}>
          <TopProjectsBar data={topProjects.map((p) => ({ projectName: p.projectName, total: p.total }))} />
        </SectionCard>
      </div>

      <SectionCard title={t("resourceTypeBreakdown")}>
        <DonutChart
          data={(byResourceType.data ?? []).map((r) => ({ name: r.name, value: r.value, color: r.color }))}
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetGauge used={total} budget={config.data?.budget ?? 0} currency={currency} />
        <ExpiringAlerts services={expiring.data ?? []} />
      </div>
    </div>
  )
}
