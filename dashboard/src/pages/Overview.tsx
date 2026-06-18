import { useLanguage } from "@/context/LanguageProvider"
import {
  useConfig, useSummary, useByService, useByProject, useByResourceType, useExpiring,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { BudgetGauge } from "@/components/BudgetGauge"
import { ExpiringAlerts } from "@/components/ExpiringAlerts"
import { DonutChart } from "@/components/charts/DonutChart"
import { TopProjectsBar } from "@/components/charts/TopProjectsBar"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"

function OverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
    </div>
  )
}

export function Overview() {
  const { t, language } = useLanguage()
  const { monthsQuery, months, selected, previous, from, to } = useSelectedMonth()

  const summary = useSummary(from, to)
  const prevSummary = useSummary(previous?.from, previous?.to)
  const byService = useByService(from, to)
  const byProject = useByProject(from, to)
  const byResourceType = useByResourceType(from, to)
  const expiring = useExpiring(30)
  const config = useConfig()

  // Months list still loading → skeletons
  if (monthsQuery.isLoading) return <OverviewSkeleton />
  // Months fetch failed OR the selected month's summary failed → error block
  if (monthsQuery.isError || summary.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }
  // Months loaded but none available (fresh install / no bills) → empty state, NOT an endless skeleton
  if (months.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        {t("noDataAvailable")}
      </div>
    )
  }
  // A month is set but not yet resolved, or its summary is still loading → skeletons (prevents the zero-flash)
  if (!selected || summary.isLoading) return <OverviewSkeleton />

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
          <DonutChart data={byService.data ?? []} currency={currency} />
        </SectionCard>
        <SectionCard title={t("topProjects")}>
          <TopProjectsBar data={topProjects.map((p) => ({ projectName: p.projectName, total: p.total }))} />
        </SectionCard>
      </div>

      <SectionCard title={t("resourceTypeBreakdown")}>
        <DonutChart
          data={(byResourceType.data ?? []).map((r) => ({ name: r.name, value: r.value, color: r.color }))}
          currency={currency}
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetGauge used={total} budget={config.data?.budget ?? 0} currency={currency} />
        <ExpiringAlerts services={expiring.data ?? []} />
      </div>
    </div>
  )
}
