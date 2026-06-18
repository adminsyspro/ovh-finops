import { useState, useEffect } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useMonths,
  useConfig,
  useSummary,
  useByService,
  useByProject,
} from "@/hooks/queries"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { DataTable } from "@/components/DataTable"
import { ServiceCompareBars } from "@/components/charts/ServiceCompareBars"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMoney, formatMonthLabel } from "@/lib/format"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "@phosphor-icons/react/dist/csr/Calendar"
import { GitDiffIcon } from "@phosphor-icons/react/dist/csr/GitDiff"

function CompareSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  )
}

type ProjectRow = {
  projectName: string
  totalA: number
  totalB: number
  variation: number | null
}

export function Compare() {
  const { t, language } = useLanguage()

  const monthsQuery = useMonths()
  const months = monthsQuery.data ?? []

  // Local state for selected month values (null = not yet initialised)
  const [monthA, setMonthA] = useState<string | null>(null)
  const [monthB, setMonthB] = useState<string | null>(null)

  // Initialise defaults once months load; also reset stale selections if a chosen
  // month is no longer present in the list (mirror MonthPicker invariant)
  useEffect(() => {
    if (months.length === 0) return
    const values = months.map((m) => m.value)

    const defaultB = months[0]?.value ?? null
    const defaultA = months[1]?.value ?? months[0]?.value ?? null

    setMonthA((prev) => {
      if (prev === null) return defaultA
      return values.includes(prev) ? prev : defaultA
    })
    setMonthB((prev) => {
      if (prev === null) return defaultB
      return values.includes(prev) ? prev : defaultB
    })
  }, [months])

  // Resolve month objects
  const a = months.find((m) => m.value === monthA) ?? null
  const b = months.find((m) => m.value === monthB) ?? null

  const config = useConfig()
  const currency = config.data?.currency ?? "EUR"

  // Fetch data for A and B
  const sumA = useSummary(a?.from, a?.to)
  const sumB = useSummary(b?.from, b?.to)
  const svcA = useByService(a?.from, a?.to)
  const svcB = useByService(b?.from, b?.to)
  const projA = useByProject(a?.from, a?.to)
  const projB = useByProject(b?.from, b?.to)

  // Gate: months loading
  if (monthsQuery.isLoading) return <CompareSkeleton />

  // Gate: months error
  if (monthsQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  // Gate: no months available
  if (months.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        {t("noDataAvailable")}
      </div>
    )
  }

  // Gate: A/B not yet resolved or summary queries still loading
  if (!a || !b || sumA.isLoading || sumB.isLoading) return <CompareSkeleton />

  // Gate: summary queries errored
  if (sumA.isError || sumB.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  // Totals
  const tA = sumA.data?.total ?? 0
  const tB = sumB.data?.total ?? 0
  const variation = tA !== 0 ? ((tB - tA) / tA) * 100 : null

  // Merge services: union of service names from A and B
  const svcMapA = new Map<string, number>(
    (svcA.data ?? []).map((s) => [s.name, s.value]),
  )
  const svcMapB = new Map<string, number>(
    (svcB.data ?? []).map((s) => [s.name, s.value]),
  )
  const allSvcNames = Array.from(
    new Set([...svcMapA.keys(), ...svcMapB.keys()]),
  )
  const mergedServices = allSvcNames.map((name) => ({
    name,
    moisA: svcMapA.get(name) ?? 0,
    moisB: svcMapB.get(name) ?? 0,
  }))

  // Merge projects by projectId (unique key); projectName is display-only
  type ProjectEntry = { projectId: string; projectName: string; totalA: number; totalB: number }
  const projMergeMap = new Map<string, ProjectEntry>()
  for (const p of projA.data ?? []) {
    projMergeMap.set(p.projectId, {
      projectId: p.projectId,
      projectName: p.projectName,
      totalA: p.total,
      totalB: 0,
    })
  }
  for (const p of projB.data ?? []) {
    const existing = projMergeMap.get(p.projectId)
    if (existing) {
      existing.totalB = p.total
      // Prefer B's name if non-empty, else keep A's
      if (p.projectName) existing.projectName = p.projectName
    } else {
      projMergeMap.set(p.projectId, {
        projectId: p.projectId,
        projectName: p.projectName,
        totalA: 0,
        totalB: p.total,
      })
    }
  }
  const mergedProjects: ProjectRow[] = Array.from(projMergeMap.values()).map(
    ({ projectName, totalA, totalB }) => {
      const v = totalA !== 0 ? ((totalB - totalA) / totalA) * 100 : null
      return { projectName, totalA, totalB, variation: v }
    },
  )

  const columns: ColumnDef<ProjectRow, string>[] = [
    {
      accessorKey: "projectName",
      header: t("project"),
      cell: ({ row }) => row.original.projectName,
    },
    {
      accessorKey: "totalA",
      header: () => <span className="text-right block">{t("monthA")}</span>,
      cell: ({ row }) => (
        <span className="text-right block">
          {formatMoney(row.original.totalA, language, currency)}
        </span>
      ),
    },
    {
      accessorKey: "totalB",
      header: () => <span className="text-right block">{t("monthB")}</span>,
      cell: ({ row }) => (
        <span className="text-right block">
          {formatMoney(row.original.totalB, language, currency)}
        </span>
      ),
    },
    {
      accessorKey: "variation",
      header: t("variation"),
      cell: ({ row }) => {
        const v = row.original.variation
        if (v === null) return <span className="text-muted-foreground">—</span>
        return (
          <span
            className={cn(
              v > 0
                ? "text-red-600"
                : v < 0
                  ? "text-green-600"
                  : "text-muted-foreground",
            )}
          >
            {v > 0 ? "+" : ""}
            {v.toFixed(1)}%
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Month selectors */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t("monthA")}
          </span>
          <Select value={monthA ?? ""} onValueChange={setMonthA}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {formatMonthLabel(m.value, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm font-semibold text-muted-foreground">
          {t("vs")}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t("monthB")}
          </span>
          <Select value={monthB ?? ""} onValueChange={setMonthB}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {formatMonthLabel(m.value, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={CalendarIcon}
          label={t("monthA")}
          value={formatMoney(tA, language, currency)}
          sublabel={a ? formatMonthLabel(a.value, language) : undefined}
        />
        <KpiCard
          icon={CalendarIcon}
          label={t("monthB")}
          value={formatMoney(tB, language, currency)}
          sublabel={b ? formatMonthLabel(b.value, language) : undefined}
        />
        <KpiCard
          icon={GitDiffIcon}
          label={t("variation")}
          value={formatMoney(tB - tA, language, currency)}
          delta={variation}
          deltaLabel=""
        />
      </div>

      {/* Service comparison chart */}
      <SectionCard title={t("serviceComparison")}>
        <ServiceCompareBars data={mergedServices} />
      </SectionCard>

      {/* Project comparison table */}
      <SectionCard title={t("projectComparison")}>
        <DataTable<ProjectRow, string>
          columns={columns}
          data={mergedProjects}
        />
      </SectionCard>
    </div>
  )
}
