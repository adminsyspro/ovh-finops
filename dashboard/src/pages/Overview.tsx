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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
      </div>
      <Skeleton className="h-64 w-full" />
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
  const serviceRows = byService.data ?? []
  const resourceRows = byResourceType.data ?? []
  const cloudShare = total > 0 ? ((s?.cloudTotal ?? 0) / total) * 100 : 0
  const topProject = topProjects[0] ?? null
  const topService = serviceRows.reduce<(typeof serviceRows)[number] | null>(
    (acc, row) => (acc === null || row.value > acc.value ? row : acc),
    null,
  )
  const topResource = resourceRows.reduce<(typeof resourceRows)[number] | null>(
    (acc, row) => (acc === null || row.value > acc.value ? row : acc),
    null,
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard accent label={t("totalCost")} value={formatMoney(total, language, currency)} delta={variation} />
        <KpiCard
          label={t("cloudShare")}
          value={`${Math.round(cloudShare)}%`}
          sublabel={formatMoney(s?.cloudTotal ?? 0, language, currency)}
        />
        <KpiCard
          label={t("strongestCostDriver")}
          value={topService?.name ?? "—"}
          sublabel={topService ? formatMoney(topService.value, language, currency) : undefined}
        />
        <KpiCard
          label={t("activeProjects")}
          value={String(s?.projectsCount ?? 0)}
          sublabel={`${s?.billsCount ?? 0} ${t("invoices").toLowerCase()}`}
        />
      </div>

      <SectionCard title={t("monthlySnapshot")}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">{t("cloudTotal")}</p>
              <p className="mt-2 text-xl font-semibold">{formatMoney(s?.cloudTotal ?? 0, language, currency)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(cloudShare, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">{t("nonCloudTotal")}</p>
              <p className="mt-2 text-xl font-semibold">{formatMoney(s?.nonCloudTotal ?? 0, language, currency)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-chart-3" style={{ width: `${Math.min(100 - cloudShare, 100)}%` }} />
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">{t("dailyAverage")}</p>
              <p className="mt-2 text-xl font-semibold">{formatMoney(s?.dailyAverage ?? 0, language, currency)}</p>
              <p className="mt-3 text-xs text-muted-foreground">{t("over30Days")}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("topProjects")}</p>
                <p className="text-xs text-muted-foreground">{topProject?.projectName ?? t("noDataAvailable")}</p>
              </div>
              <Badge variant="secondary" className="rounded-md">{topProjects.length}</Badge>
            </div>
            <div className="space-y-4">
              {topProjects.slice(0, 5).map((project) => {
                const pct = total > 0 ? (project.total / total) * 100 : 0
                return (
                  <div key={project.projectId} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{project.projectName}</span>
                      <span className="shrink-0 text-muted-foreground">{formatMoney(project.total, language, currency)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title={t("serviceBreakdown")}>
          <DonutChart data={byService.data ?? []} currency={currency} />
        </SectionCard>
        <SectionCard title={t("topProjects")}>
          <TopProjectsBar data={topProjects.map((p) => ({ projectName: p.projectName, total: p.total }))} />
        </SectionCard>
      </div>

      <SectionCard title={t("resourceTypeBreakdown")}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
          <DonutChart
            data={resourceRows.map((r) => ({ name: r.name, value: r.value, color: r.color }))}
            currency={currency}
          />
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-sm font-semibold">{t("topResourceType")}</p>
            <p className="mt-2 text-2xl font-semibold">{topResource?.name ?? "—"}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {topResource ? formatMoney(topResource.value, language, currency) : t("noDataAvailable")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-md">{resourceRows.length} {t("resourceType").toLowerCase()}</Badge>
              <Badge variant="outline" className="rounded-md">{topResource?.serviceCount ?? 0} {t("trackedResources").toLowerCase()}</Badge>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetGauge used={total} budget={config.data?.budget ?? 0} currency={currency} />
        <ExpiringAlerts services={expiring.data ?? []} />
      </div>
    </div>
  )
}
