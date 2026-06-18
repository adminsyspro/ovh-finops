import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useInventorySummary,
  useInventoryServers,
  useInventoryVps,
  useInventoryStorage,
  useExpiring,
} from "@/hooks/queries"
import { KpiCard } from "@/components/KpiCard"
import { DataTable } from "@/components/DataTable"
import { ExpiringAlerts } from "@/components/ExpiringAlerts"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { DedicatedServer, VpsInstance, StorageService } from "@/services/api"

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
      accessorFn: (row) => `${row.total_size_gb} GB`,
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
        <KpiCard label={t("dedicatedServers")} value={String(s?.servers ?? 0)} />
        <KpiCard label={t("vpsInstances")} value={String(s?.vps ?? 0)} />
        <KpiCard label={t("storageServices")} value={String(s?.storage ?? 0)} />
        <KpiCard label={t("cloudProjects")} value={String(s?.cloud_projects ?? 0)} />
        <KpiCard label={t("totalResources")} value={String(s?.total ?? 0)} />
        <KpiCard label={t("expiringSoon")} value={String(s?.expiring_soon ?? 0)} />
      </div>

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
