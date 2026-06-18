import { type ColumnDef } from "@tanstack/react-table"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/DataTable"
import { useProjectsEnriched, useConfig } from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { type EnrichedProject } from "@/services/api"
import { formatMoney } from "@/lib/format"
import { useLanguage } from "@/context/LanguageProvider"
import { Skeleton } from "@/components/ui/skeleton"

export function Projects() {
  const { t, language } = useLanguage()
  const { from, to } = useSelectedMonth()
  const { data: projects, isLoading, isError } = useProjectsEnriched(from, to)
  const currency = useConfig().data?.currency ?? "EUR"

  const columns: ColumnDef<EnrichedProject>[] = [
    {
      accessorKey: "name",
      header: t("project"),
    },
    {
      id: "status",
      header: t("state"),
      cell: ({ row }) => row.original.status ?? "—",
    },
    {
      accessorKey: "instance_count",
      header: t("instances"),
    },
    {
      accessorKey: "consumption_total",
      header: t("amount"),
      cell: ({ row }) => (
        <div className="text-right">
          {formatMoney(row.original.consumption_total, language, currency)}
        </div>
      ),
      enableSorting: true,
    },
  ]

  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  return (
    <div className="p-6">
      <DataTable<EnrichedProject, unknown>
        columns={columns}
        data={projects ?? []}
        searchPlaceholder={t("project")}
        onRowClick={(p) => navigate(`/projects/${p.id}`)}
      />
    </div>
  )
}
