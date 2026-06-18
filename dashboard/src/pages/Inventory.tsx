import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useConsumptionCurrent,
  useConsumptionForecast,
  useConsumptionHistory,
  useInventorySummary,
  useInventoryServers,
  useInventoryVps,
  useInventoryStorage,
  useExpiring,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { DataTable } from "@/components/DataTable"
import { ExpiringAlerts } from "@/components/ExpiringAlerts"
import { TrendLineChart } from "@/components/charts/TrendLineChart"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"
import type { DedicatedServer, VpsInstance, StorageService } from "@/services/api"
import { CloudIcon } from "@phosphor-icons/react/dist/csr/Cloud"
import { DatabaseIcon } from "@phosphor-icons/react/dist/csr/Database"
import { DesktopTowerIcon } from "@phosphor-icons/react/dist/csr/DesktopTower"
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/csr/DeviceMobile"
import { PulseIcon } from "@phosphor-icons/react/dist/csr/Pulse"
import { SquaresFourIcon } from "@phosphor-icons/react/dist/csr/SquaresFour"
import { TargetIcon } from "@phosphor-icons/react/dist/csr/Target"
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning"

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 rounded-full bg-muted">
      <div
        data-testid="consumption-progress"
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function InventoryConsumptionPanel() {
  const { t, language } = useLanguage()
  const { monthsQuery, months, selected, from, to } = useSelectedMonth()
  const current = useConsumptionCurrent(from, to)
  const forecast = useConsumptionForecast(from, to)
  const history = useConsumptionHistory(from, to)

  if (monthsQuery.isLoading || current.isLoading || forecast.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }

  if (monthsQuery.isError || current.isError || forecast.isError || months.length === 0 || !selected) {
    return null
  }

  const currentData = current.data
  const forecastData = forecast.data
  const currentTotal = currentData?.current_total ?? 0
  const currentCurrency = currentData?.currency ?? "EUR"
  const forecastTotal = forecastData?.forecast_total ?? 0
  const forecastCurrency = forecastData?.currency ?? "EUR"
  const progressPct = forecastData?.progress ?? 0

  let currentSublabel: string
  if (currentData?.source === "cloud_projects") {
    currentSublabel = `Public Cloud${currentData.project_count != null ? ` · ${currentData.project_count} ${t("cloudProjects")}` : ""}`
  } else if (currentData?.period_start && currentData?.period_end) {
    currentSublabel = `${currentData.period_start} → ${currentData.period_end}`
  } else {
    currentSublabel = t("forecastEndOfMonth")
  }

  const forecastIsSelectedPeriod = forecastData?.source === "selected_period"
  let forecastSublabel: string
  if (forecastIsSelectedPeriod && forecastData?.period_start && forecastData?.period_end) {
    forecastSublabel = `${forecastData.period_start} → ${forecastData.period_end}`
  } else if (forecastData?.days_elapsed != null) {
    forecastSublabel = `${forecastData.days_elapsed}/${forecastData.days_in_month ?? "?"} ${t("days")}`
  } else {
    forecastSublabel = t("forecastEndOfMonth")
  }

  const aggregated = new Map<string, number>()
  for (const row of history.data ?? []) {
    const key = row.period_start.slice(0, 7)
    aggregated.set(key, (aggregated.get(key) ?? 0) + row.total)
  }
  const historyChartData = Array.from(aggregated.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, cost]) => ({ label, cost }))

  return (
    <>
      <SectionCard title={t("cloudConsumption")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative min-h-28 overflow-hidden rounded-lg border border-l-4 border-l-primary bg-card p-5 shadow-xs">
            <PulseIcon weight="duotone" className="pointer-events-none absolute right-3 top-1/2 size-24 -translate-y-1/2 text-muted-foreground/15" aria-hidden="true" />
            <p className="relative z-10 pr-12 text-sm text-muted-foreground">{t("currentConsumption")}</p>
            <p className="relative z-10 mt-3 pr-10 text-2xl font-semibold">
              {formatMoney(currentTotal, language, currentCurrency)}
            </p>
            <div className="relative z-10 mt-3 pr-10">
              <ProgressBar pct={progressPct} />
            </div>
            <p className="relative z-10 mt-3 pr-10 text-xs text-muted-foreground">{currentSublabel}</p>
          </div>

          <div className="relative min-h-28 overflow-hidden rounded-lg border border-l-4 border-l-primary bg-card p-5 shadow-xs">
            <TargetIcon weight="duotone" className="pointer-events-none absolute right-3 top-1/2 size-24 -translate-y-1/2 text-muted-foreground/15" aria-hidden="true" />
            <p className="relative z-10 pr-12 text-sm text-muted-foreground">
              {forecastIsSelectedPeriod ? t("selectedPeriod") : t("forecastEndOfMonth")}
            </p>
            <p className="relative z-10 mt-3 pr-10 text-2xl font-semibold">
              {formatMoney(forecastTotal, language, forecastCurrency)}
            </p>
            <div className="relative z-10 mt-3 pr-10">
              <ProgressBar pct={progressPct} />
            </div>
            <p className="relative z-10 mt-3 pr-10 text-xs text-muted-foreground">{forecastSublabel}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("consumptionHistory")}>
        <TrendLineChart data={historyChartData} variant="area" />
      </SectionCard>
    </>
  )
}

export function Inventory() {
  const { t } = useLanguage()

  const summary = useInventorySummary()
  const servers = useInventoryServers()
  const vps = useInventoryVps()
  const storage = useInventoryStorage()
  const expiring = useExpiring(30)

  if (summary.isLoading) {
    return <InventorySkeleton />
  }

  if (summary.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  const s = summary.data

  // Columns: Dedicated servers
  const serverCols: ColumnDef<DedicatedServer>[] = [
    {
      id: "name",
      header: t("name"),
      accessorFn: (row) => row.display_name || row.id,
    },
    {
      accessorKey: "datacenter",
      header: t("datacenter"),
    },
    {
      accessorKey: "cpu",
      header: t("cpu"),
    },
    {
      id: "ram",
      header: t("ram"),
      accessorFn: (row) => `${Math.round(row.ram_size / 1024)} GB`,
    },
    {
      id: "state",
      header: t("state"),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.state === "ok"
              ? "text-green-600 border-green-600"
              : "text-muted-foreground"
          }
        >
          {row.original.state}
        </Badge>
      ),
    },
    {
      id: "expirationDate",
      header: t("expirationDate"),
      accessorFn: (row) => row.expiration_date ?? "—",
    },
    {
      id: "renewal",
      header: t("renewal"),
      accessorFn: (row) => row.renewal_type ?? "—",
    },
  ]

  // Columns: VPS instances
  const vpsCols: ColumnDef<VpsInstance>[] = [
    {
      id: "name",
      header: t("name"),
      accessorFn: (row) => row.display_name || row.id,
    },
    {
      accessorKey: "model",
      header: t("model"),
    },
    {
      id: "region",
      header: t("region"),
      accessorKey: "zone",
    },
    {
      id: "specs",
      header: t("specs"),
      accessorFn: (row) => `${row.vcpus} vCPU · ${row.ram_mb}MB · ${row.disk_gb}GB`,
    },
    {
      id: "state",
      header: t("state"),
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.state === "running"
              ? "text-green-600 border-green-600"
              : "text-muted-foreground"
          }
        >
          {row.original.state}
        </Badge>
      ),
    },
    {
      id: "expirationDate",
      header: t("expirationDate"),
      accessorFn: (row) => row.expiration_date ?? "—",
    },
  ]

  // Columns: Storage services
  const storageCols: ColumnDef<StorageService>[] = [
    {
      id: "name",
      header: t("name"),
      accessorFn: (row) => row.display_name || row.id,
    },
    {
      id: "type",
      header: t("type"),
      accessorKey: "service_type",
    },
    {
      accessorKey: "region",
      header: t("region"),
    },
    {
      id: "size",
      header: t("size"),
      accessorFn: (row) => row.total_size_gb ? `${row.total_size_gb} GB` : "—",
    },
    {
      id: "shares",
      header: t("shares"),
      accessorFn: (row) => row.share_count ?? "—",
    },
    {
      id: "expirationDate",
      header: t("expirationDate"),
      accessorFn: (row) => row.expiration_date ?? "—",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={DesktopTowerIcon} label={t("dedicatedServers")} value={String(s?.servers ?? 0)} />
        <KpiCard icon={DeviceMobileIcon} label={t("vpsInstances")} value={String(s?.vps ?? 0)} />
        <KpiCard icon={DatabaseIcon} label={t("storageServices")} value={String(s?.storage ?? 0)} />
        <KpiCard icon={CloudIcon} label={t("cloudProjects")} value={String(s?.cloud_projects ?? 0)} />
        <KpiCard icon={SquaresFourIcon} label={t("totalResources")} value={String(s?.total ?? 0)} />
        <KpiCard icon={WarningIcon} label={t("expiringSoon")} value={String(s?.expiring_soon ?? 0)} />
      </div>

      <InventoryConsumptionPanel />

      {/* Tabs with 3 DataTables */}
      <Tabs defaultValue="servers">
        <TabsList>
          <TabsTrigger value="servers">{t("dedicatedServers")}</TabsTrigger>
          <TabsTrigger value="vps">{t("vpsInstances")}</TabsTrigger>
          <TabsTrigger value="storage">{t("storageServices")}</TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="mt-4">
          <DataTable<DedicatedServer, unknown>
            columns={serverCols}
            data={servers.data ?? []}
          />
        </TabsContent>

        <TabsContent value="vps" className="mt-4">
          <DataTable<VpsInstance, unknown>
            columns={vpsCols}
            data={vps.data ?? []}
          />
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <DataTable<StorageService, unknown>
            columns={storageCols}
            data={storage.data ?? []}
          />
        </TabsContent>
      </Tabs>

      {/* Expiring alerts */}
      <ExpiringAlerts services={expiring.data ?? []} />
    </div>
  )
}
