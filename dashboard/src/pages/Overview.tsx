import { useState } from "react"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useConfig, useSummary, useByService, useByResourceType, useExpiring, useServiceDetails,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { BudgetGauge } from "@/components/BudgetGauge"
import { ExpiringAlerts } from "@/components/ExpiringAlerts"
import { DonutChart, type DonutDatum } from "@/components/charts/DonutChart"
import { ServiceDetailSheet } from "@/components/ServiceDetailSheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"
import { CloudIcon } from "@phosphor-icons/react/dist/csr/Cloud"
import { FoldersIcon } from "@phosphor-icons/react/dist/csr/Folders"
import { GaugeIcon } from "@phosphor-icons/react/dist/csr/Gauge"
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet"

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
  const [selectedService, setSelectedService] = useState<DonutDatum | null>(null)
  const { monthsQuery, months, selected, previous, from, to } = useSelectedMonth()

  const summary = useSummary(from, to)
  const prevSummary = useSummary(previous?.from, previous?.to)
  const byService = useByService(from, to)
  const byResourceType = useByResourceType(from, to)
  const serviceDetails = useServiceDetails(selectedService?.name, from, to)
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
  const serviceRows = byService.data ?? []
  const resourceRows = byResourceType.data ?? []
  const cloudShare = total > 0 ? ((s?.cloudTotal ?? 0) / total) * 100 : 0
  const topService = serviceRows.reduce<(typeof serviceRows)[number] | null>(
    (acc, row) => (acc === null || row.value > acc.value ? row : acc),
    null,
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard accent icon={WalletIcon} label={t("totalCost")} value={formatMoney(total, language, currency)} delta={variation} />
        <KpiCard
          icon={CloudIcon}
          label={t("cloudShare")}
          value={`${Math.round(cloudShare)}%`}
          sublabel={formatMoney(s?.cloudTotal ?? 0, language, currency)}
        />
        <KpiCard
          icon={GaugeIcon}
          label={t("strongestCostDriver")}
          value={topService?.name ?? "—"}
          sublabel={topService ? formatMoney(topService.value, language, currency) : undefined}
        />
        <KpiCard
          icon={FoldersIcon}
          label={t("activeProjects")}
          value={String(s?.projectsCount ?? 0)}
          sublabel={`${s?.billsCount ?? 0} ${t("invoices").toLowerCase()}`}
        />
      </div>

      <SectionCard title={t("monthlySnapshot")}>
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
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title={t("serviceBreakdown")}>
          <DonutChart data={byService.data ?? []} currency={currency} onDatumClick={setSelectedService} />
        </SectionCard>
        <SectionCard title={t("resourceTypeBreakdown")}>
          <div className="min-h-[260px]">
            <DonutChart
              data={resourceRows.map((r) => ({ name: r.name, value: r.value, color: r.color }))}
              currency={currency}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetGauge used={total} budget={config.data?.budget} currency={currency} />
        <ExpiringAlerts services={expiring.data ?? []} />
      </div>
      <ServiceDetailSheet
        open={selectedService !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedService(null)
        }}
        serviceName={selectedService?.name ?? null}
        total={selectedService?.value}
        rows={serviceDetails.data ?? []}
        isLoading={serviceDetails.isLoading}
        isError={serviceDetails.isError}
        currency={currency}
      />
    </div>
  )
}
