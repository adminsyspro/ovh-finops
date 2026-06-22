import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useConfig, useByService, useByResourceType, useResourceTypeDetails,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { type ResourceTypeBreakdown, type ResourceTypeDetail } from "@/services/api"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { DonutChart } from "@/components/charts/DonutChart"
import { DataTable } from "@/components/DataTable"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"
import { ChartPieSliceIcon } from "@phosphor-icons/react/dist/csr/ChartPieSlice"
import { StackIcon } from "@phosphor-icons/react/dist/csr/Stack"
import { TreeStructureIcon } from "@phosphor-icons/react/dist/csr/TreeStructure"
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet"

function ServicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function Services() {
  const { t, language } = useLanguage()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const { monthsQuery, months, selected, from, to } = useSelectedMonth()

  const byService = useByService(from, to)
  const byResourceType = useByResourceType(from, to)
  const resourceTypeDetails = useResourceTypeDetails(selectedType, from, to)
  const currency = useConfig().data?.currency ?? "EUR"

  // Months list still loading → skeletons
  if (monthsQuery.isLoading) return <ServicesSkeleton />
  // Months fetch failed OR byService fetch failed → error block
  if (monthsQuery.isError || byService.isError) {
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
  // A month is set but not yet resolved, or service data is still loading → skeletons
  if (!selected || byService.isLoading || byResourceType.isLoading) return <ServicesSkeleton />

  const serviceRows = byService.data ?? []
  const resourceRows = byResourceType.data ?? []
  const totalCost = serviceRows.reduce((sum, row) => sum + row.value, 0)
  const billingLines = serviceRows.reduce((sum, row) => sum + row.detailsCount, 0)
  const trackedResources = resourceRows.reduce((sum, row) => sum + row.serviceCount, 0)
  const topService = serviceRows.reduce<(typeof serviceRows)[number] | null>(
    (acc, row) => (acc === null || row.value > acc.value ? row : acc),
    null,
  )
  const topResource = resourceRows.reduce<ResourceTypeBreakdown | null>(
    (acc, row) => (acc === null || row.value > acc.value ? row : acc),
    null,
  )

  const serviceChartData = serviceRows.map((row) => ({
    name: row.name,
    value: row.value,
    color: row.color,
  }))

  const resourceChartData = resourceRows.map((r) => ({
    name: r.name,
    value: r.value,
    color: r.color,
  }))

  const topServices = [...serviceRows].sort((a, b) => b.value - a.value).slice(0, 6)
  const selectedResource = selectedType
    ? resourceRows.find((row) => row.resource_type === selectedType) ?? null
    : null

  const resourceTypeColumns: ColumnDef<ResourceTypeBreakdown>[] = [
    {
      accessorKey: "name",
      header: t("resourceType"),
    },
    {
      accessorKey: "value",
      header: t("amount"),
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.value, language, currency)}
        </div>
      ),
    },
    {
      accessorKey: "serviceCount",
      header: t("totalResources"),
    },
  ]

  const detailColumns: ColumnDef<ResourceTypeDetail>[] = [
    {
      accessorKey: "domain",
      header: t("domain"),
    },
    {
      id: "description",
      header: t("description"),
      cell: ({ row }) => row.original.description ?? "—",
    },
    {
      accessorKey: "total",
      header: t("amount"),
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.total, language, currency)}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={WalletIcon}
          label={t("totalCost")}
          value={formatMoney(totalCost, language, currency)}
          sublabel={`${billingLines} ${t("billingLines")}`}
          accent
        />
        <KpiCard
          icon={ChartPieSliceIcon}
          label={t("topService")}
          value={topService?.name ?? "—"}
          sublabel={topService ? formatMoney(topService.value, language, currency) : undefined}
        />
        <KpiCard
          icon={TreeStructureIcon}
          label={t("serviceFamilies")}
          value={String(serviceRows.length)}
          sublabel={`${resourceRows.length} ${t("resourceType").toLowerCase()}`}
        />
        <KpiCard
          icon={StackIcon}
          label={t("trackedResources")}
          value={String(trackedResources)}
          sublabel={topResource ? `${t("topResourceType")}: ${topResource.name}` : undefined}
        />
      </div>

      <SectionCard title={t("serviceBreakdown")}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="min-h-[280px]">
            <DonutChart data={serviceChartData} currency={currency} />
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("costDistribution")}</p>
                <p className="text-xs text-muted-foreground">{t("serviceFamilies")}</p>
              </div>
              <Badge variant="secondary" className="rounded-md">{serviceRows.length}</Badge>
            </div>
            <div className="space-y-4">
              {topServices.map((row) => {
                const pct = totalCost > 0 ? (row.value / totalCost) * 100 : 0
                return (
                  <div key={row.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: row.color }} />
                        <span className="truncate font-medium">{row.name}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatMoney(row.value, language, currency)}</span>
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

      <SectionCard title={t("resourceTypeBreakdown")}>
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
            <DonutChart data={resourceChartData} currency={currency} />
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("clickResourceType")}</p>
              <DataTable<ResourceTypeBreakdown, unknown>
                columns={resourceTypeColumns}
                data={resourceRows}
                searchPlaceholder={t("resourceType")}
                onRowClick={(r) => setSelectedType(r.resource_type)}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {selectedType && (
        <SectionCard title={selectedType}>
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("resourceType")}</p>
                <p className="mt-1 text-sm font-semibold">{selectedResource?.name ?? selectedType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("amount")}</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatMoney(selectedResource?.value ?? 0, language, currency)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge variant="secondary" className="rounded-md">
                  {selectedResource?.serviceCount ?? 0} {t("trackedResources").toLowerCase()}
                </Badge>
                <Badge variant="outline" className="rounded-md">
                  {selectedResource?.detailsCount ?? 0} {t("billingLines")}
                </Badge>
              </div>
            </div>
            <DataTable<ResourceTypeDetail, unknown>
              columns={detailColumns}
              data={resourceTypeDetails.data ?? []}
              searchPlaceholder={t("domain")}
            />
          </div>
        </SectionCard>
      )}
    </div>
  )
}
