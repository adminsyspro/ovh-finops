import { useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { usePeriod } from "@/context/PeriodContext"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useMonths, useConfig, useByService, useByResourceType, useResourceTypeDetails,
} from "@/hooks/queries"
import { type ResourceTypeBreakdown, type ResourceTypeDetail } from "@/services/api"
import { SectionCard } from "@/components/SectionCard"
import { DonutChart } from "@/components/charts/DonutChart"
import { DataTable } from "@/components/DataTable"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"

function ServicesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function Services() {
  const { t, language } = useLanguage()
  const { selectedMonth } = usePeriod()
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const monthsQuery = useMonths()
  const months = monthsQuery.data ?? []
  const selected = months.find((m) => m.value === selectedMonth) ?? null
  const from = selected?.from
  const to = selected?.to

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
  // A month is set but not yet resolved, or byService is still loading → skeletons
  if (!selected || byService.isLoading) return <ServicesSkeleton />

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
      <SectionCard title={t("serviceBreakdown")}>
        <DonutChart data={byService.data ?? []} currency={currency} />
      </SectionCard>

      <SectionCard title={t("resourceTypeBreakdown")}>
        <div className="space-y-6">
          <DonutChart
            data={(byResourceType.data ?? []).map((r) => ({
              name: r.name,
              value: r.value,
              color: r.color,
            }))}
            currency={currency}
          />
          <DataTable<ResourceTypeBreakdown, unknown>
            columns={resourceTypeColumns}
            data={byResourceType.data ?? []}
            searchPlaceholder={t("resourceType")}
            onRowClick={(r) => setSelectedType(r.resource_type)}
          />
        </div>
      </SectionCard>

      {selectedType && (
        <SectionCard title={selectedType}>
          <DataTable<ResourceTypeDetail, unknown>
            columns={detailColumns}
            data={resourceTypeDetails.data ?? []}
            searchPlaceholder={t("domain")}
          />
        </SectionCard>
      )}
    </div>
  )
}
