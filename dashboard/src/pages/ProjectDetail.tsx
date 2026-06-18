import { useParams } from "react-router-dom"
import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useConfig,
  useProjectsEnriched,
  useProjectInstanceTotal,
  useProjectInstances,
  useProjectQuotas,
  useProjectBuckets,
  useProjectConsumption,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import {
  type CloudInstance,
  type ProjectBucket,
} from "@/services/api"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { DataTable } from "@/components/DataTable"
import { DonutChart } from "@/components/charts/DonutChart"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { HardDrivesIcon } from "@phosphor-icons/react/dist/csr/HardDrives"

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const GPU_PATTERN = /^(l4-|l40s-|a100-|h100-|v100-|t1-|t2-)/

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useLanguage()
  const { monthsQuery, months, selected, from, to } = useSelectedMonth()

  const currency = useConfig().data?.currency ?? "EUR"

  const projectsEnriched = useProjectsEnriched()
  const projectName =
    projectsEnriched.data?.find((p) => p.id === id)?.name ?? id

  const instancesQuery = useProjectInstances(id)
  const quotasQuery = useProjectQuotas(id)
  const bucketsQuery = useProjectBuckets(id, from, to)
  const consumptionQuery = useProjectConsumption(id, from, to)
  const instanceTotalQuery = useProjectInstanceTotal(id, from, to)

  // Page gate: months or month-independent instance list loading
  if (monthsQuery.isLoading || instancesQuery.isLoading) return <ProjectDetailSkeleton />

  // Page gate: error
  if (monthsQuery.isError || instancesQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  // Page gate: no months available
  if (months.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        {t("noDataAvailable")}
      </div>
    )
  }

  // Page gate: month not resolved or month-scoped queries loading
  if (!selected || instanceTotalQuery.isLoading || consumptionQuery.isLoading || bucketsQuery.isLoading) {
    return <ProjectDetailSkeleton />
  }

  // ── Consumption aggregation by resource_type ──────────────────────────
  const consumptionRows = consumptionQuery.data ?? []
  const aggregationMap = new Map<string, number>()
  for (const row of consumptionRows) {
    aggregationMap.set(
      row.resource_type,
      (aggregationMap.get(row.resource_type) ?? 0) + row.total_price,
    )
  }
  const consumptionChartData = Array.from(aggregationMap.entries()).map(
    ([resource_type, sum], i) => ({
      name: resource_type,
      value: sum,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }),
  )

  // ── Instance columns ──────────────────────────────────────────────────
  const instanceColumns: ColumnDef<CloudInstance>[] = [
    {
      accessorKey: "name",
      header: t("instances"),
      cell: ({ row }) => {
        const { name, plan_code, flavor } = row.original
        const flavorKey = plan_code || flavor
        const isGpu = GPU_PATTERN.test(flavorKey ?? "")
        return (
          <span className="flex items-center gap-2">
            {name}
            {isGpu && <Badge variant="outline">GPU</Badge>}
          </span>
        )
      },
    },
    {
      id: "flavor",
      header: t("flavor"),
      cell: ({ row }) => row.original.plan_code || row.original.flavor,
    },
    {
      accessorKey: "region",
      header: t("region"),
    },
    {
      id: "status",
      header: t("state"),
      cell: ({ row }) => {
        const s = row.original.status
        return (
          <span
            className={cn(
              s === "ACTIVE" ? "text-green-600" : "text-muted-foreground",
            )}
          >
            {s}
          </span>
        )
      },
    },
  ]

  // ── Bucket columns ────────────────────────────────────────────────────
  const bucketColumns: ColumnDef<ProjectBucket>[] = [
    {
      accessorKey: "name",
      header: t("name"),
    },
    {
      accessorKey: "type",
      header: t("type"),
      cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
    },
    {
      accessorKey: "region",
      header: t("region"),
      cell: ({ row }) => row.original.region || "-",
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

  // ── Quota grid ────────────────────────────────────────────────────────
  const activeQuotas = (quotasQuery.data ?? []).filter(
    (q) => (q.used_cores ?? 0) > 0 || (q.used_instances ?? 0) > 0,
  )

  function progressColor(pct: number) {
    if (pct > 80) return "bg-orange-500"
    if (pct > 50) return "bg-amber-500"
    return "bg-primary"
  }

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-semibold">{projectName}</h1>
        <KpiCard
          icon={HardDrivesIcon}
          label={t("monthlyBilling")}
          value={formatMoney(instanceTotalQuery.data?.total ?? 0, language, currency)}
        />
      </div>

      {/* ── Consumption by resource type ────────────────────────────────── */}
      <SectionCard title={t("consumption")}>
        <DonutChart data={consumptionChartData} currency={currency} />
      </SectionCard>

      {/* ── Instances ───────────────────────────────────────────────────── */}
      <SectionCard title={t("instances")}>
        <DataTable<CloudInstance, unknown>
          columns={instanceColumns}
          data={instancesQuery.data ?? []}
          searchPlaceholder={t("instances")}
        />
      </SectionCard>

      {/* ── Quotas by region ────────────────────────────────────────────── */}
      <SectionCard title={t("quotas")}>
        {activeQuotas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noDataAvailable")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeQuotas.map((q) => {
              const corePct =
                q.max_cores && q.max_cores > 0
                  ? Math.min(((q.used_cores ?? 0) / q.max_cores) * 100, 100)
                  : 0
              const instPct =
                q.max_instances && q.max_instances > 0
                  ? Math.min(((q.used_instances ?? 0) / q.max_instances) * 100, 100)
                  : 0
              return (
                <div
                  key={q.region}
                  className="rounded-lg border bg-card p-4 space-y-3"
                >
                  <p className="font-medium text-sm">{q.region}</p>

                  {/* vCPU */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("cores")}</span>
                      <span>
                        {q.used_cores ?? 0}
                        {q.max_cores != null ? ` / ${q.max_cores}` : ""}
                      </span>
                    </div>
                    {q.max_cores != null && q.max_cores > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", progressColor(corePct))}
                          style={{ width: `${corePct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Instances */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("instances")}</span>
                      <span>
                        {q.used_instances ?? 0}
                        {q.max_instances != null ? ` / ${q.max_instances}` : ""}
                      </span>
                    </div>
                    {q.max_instances != null && q.max_instances > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", progressColor(instPct))}
                          style={{ width: `${instPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Buckets ─────────────────────────────────────────────────────── */}
      <SectionCard title={t("buckets")}>
        <DataTable<ProjectBucket, unknown>
          columns={bucketColumns}
          data={bucketsQuery.data ?? []}
        />
      </SectionCard>
    </div>
  )
}
