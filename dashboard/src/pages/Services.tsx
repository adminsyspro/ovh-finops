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

  const months = useMonths().data ?? []
  const selected = months.find((m) => m.value === selectedMonth) ?? null
  const from = selected?.from
  const to = selected?.to

  const byService = useByService(from, to)
  const byResourceType = useByResourceType(from, to)
  const resourceTypeDetails = useResourceTypeDetails(selectedType, from, to)
  const currency = useConfig().data?.currency ?? "EUR"

  if (!selectedMonth || byService.isLoading) return <ServicesSkeleton />

  if (byService.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

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
        <DonutChart data={byService.data ?? []} />
      </SectionCard>

      <SectionCard title={t("resourceTypeBreakdown")}>
        <div className="space-y-6">
          <DonutChart
            data={(byResourceType.data ?? []).map((r) => ({
              name: r.name,
              value: r.value,
              color: r.color,
            }))}
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
