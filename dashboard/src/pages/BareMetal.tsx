import { useMemo, useState } from "react"
import { type ColumnDef } from "@tanstack/react-table"
import { useLanguage } from "@/context/LanguageProvider"
import {
  useByResourceType,
  useConfig,
  useExpiring,
  useInventoryServers,
  useInventoryStorage,
  useInventorySummary,
  useInventoryVps,
  useResourceTypeDetails,
} from "@/hooks/queries"
import { useSelectedMonth } from "@/hooks/useSelectedMonth"
import { type DedicatedServer, type ResourceTypeBreakdown, type ResourceTypeDetail, type StorageService, type VpsInstance } from "@/services/api"
import { KpiCard } from "@/components/KpiCard"
import { SectionCard } from "@/components/SectionCard"
import { DataTable } from "@/components/DataTable"
import { DonutChart } from "@/components/charts/DonutChart"
import { ExpiringAlerts } from "@/components/ExpiringAlerts"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMoney } from "@/lib/format"
import { DatabaseIcon } from "@phosphor-icons/react/dist/csr/Database"
import { DesktopTowerIcon } from "@phosphor-icons/react/dist/csr/DesktopTower"
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/csr/DeviceMobile"
import { HardDrivesIcon } from "@phosphor-icons/react/dist/csr/HardDrives"
import { WarningIcon } from "@phosphor-icons/react/dist/csr/Warning"

const BARE_METAL_TYPES = new Set([
  "dedicated_server",
  "vps",
  "storage",
  "backup",
  "ip_service",
  "license",
  "load_balancer",
  "private_cloud",
  "private_cloud_host",
  "private_cloud_datastore",
])

function BareMetalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function isOkState(state: string | null | undefined) {
  return ["ok", "running", "active", "enabled"].includes((state ?? "").toLowerCase())
}

function formatServerSpecs(server: DedicatedServer) {
  const ram = server.ram_size ? `${Math.round(server.ram_size / 1024)} GB RAM` : "—"
  return [server.cpu, ram].filter(Boolean).join(" · ")
}

function formatStorageSize(storage: StorageService) {
  if (storage.used_size_gb && storage.total_size_gb) return `${storage.used_size_gb} / ${storage.total_size_gb} GB`
  if (storage.total_size_gb) return `${storage.total_size_gb} GB`
  if (storage.used_size_gb) return `${storage.used_size_gb} GB`
  return "—"
}

export function BareMetal() {
  const { t, language } = useLanguage()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const { monthsQuery, from, to } = useSelectedMonth()

  const summary = useInventorySummary()
  const servers = useInventoryServers()
  const vps = useInventoryVps()
  const storage = useInventoryStorage()
  const expiring = useExpiring(30)
  const byResourceType = useByResourceType(from, to)
  const resourceTypeDetails = useResourceTypeDetails(selectedType, from, to)
  const currency = useConfig().data?.currency ?? "EUR"

  const resourceRows = useMemo(
    () => (byResourceType.data ?? []).filter((row) => BARE_METAL_TYPES.has(row.resource_type)),
    [byResourceType.data],
  )
  const totalCost = resourceRows.reduce((sum, row) => sum + row.value, 0)
  const trackedResources = (summary.data?.servers ?? 0) + (summary.data?.vps ?? 0) + (summary.data?.storage ?? 0)
  const topResource = resourceRows.reduce<ResourceTypeBreakdown | null>(
    (acc, row) => (acc === null || row.value > acc.value ? row : acc),
    null,
  )
  const activeServers = (servers.data ?? []).filter((server) => isOkState(server.state)).length
  const activeVps = (vps.data ?? []).filter((item) => isOkState(item.state)).length
  const selectedResource = selectedType
    ? resourceRows.find((row) => row.resource_type === selectedType) ?? null
    : null

  const serverCols: ColumnDef<DedicatedServer>[] = [
    { id: "name", header: t("name"), accessorFn: (row) => row.display_name || row.id },
    { accessorKey: "datacenter", header: t("datacenter") },
    { id: "specs", header: t("specs"), accessorFn: formatServerSpecs },
    {
      id: "state",
      header: t("state"),
      cell: ({ row }) => (
        <Badge variant="outline" className={isOkState(row.original.state) ? "border-green-600 text-green-600" : "text-muted-foreground"}>
          {row.original.state}
        </Badge>
      ),
    },
    { id: "expirationDate", header: t("expirationDate"), accessorFn: (row) => row.expiration_date ?? "—" },
    { id: "renewal", header: t("renewal"), accessorFn: (row) => row.renewal_type ?? "—" },
  ]

  const vpsCols: ColumnDef<VpsInstance>[] = [
    { id: "name", header: t("name"), accessorFn: (row) => row.display_name || row.id },
    { accessorKey: "model", header: t("model") },
    { id: "region", header: t("region"), accessorKey: "zone" },
    { id: "specs", header: t("specs"), accessorFn: (row) => `${row.vcpus} vCPU · ${row.ram_mb} MB · ${row.disk_gb} GB` },
    {
      id: "state",
      header: t("state"),
      cell: ({ row }) => (
        <Badge variant="outline" className={isOkState(row.original.state) ? "border-green-600 text-green-600" : "text-muted-foreground"}>
          {row.original.state}
        </Badge>
      ),
    },
    { id: "expirationDate", header: t("expirationDate"), accessorFn: (row) => row.expiration_date ?? "—" },
  ]

  const storageCols: ColumnDef<StorageService>[] = [
    { id: "name", header: t("name"), accessorFn: (row) => row.display_name || row.id },
    { id: "type", header: t("type"), accessorKey: "service_type" },
    { accessorKey: "region", header: t("region") },
    { id: "size", header: t("size"), accessorFn: formatStorageSize },
    { id: "shares", header: t("shares"), accessorFn: (row) => row.share_count ?? "—" },
    { id: "expirationDate", header: t("expirationDate"), accessorFn: (row) => row.expiration_date ?? "—" },
  ]

  const resourceTypeColumns: ColumnDef<ResourceTypeBreakdown>[] = [
    { accessorKey: "name", header: t("resourceType") },
    {
      accessorKey: "value",
      header: t("amount"),
      cell: ({ row }) => <div className="text-right">{formatMoney(row.original.value, language, currency)}</div>,
    },
    { accessorKey: "serviceCount", header: t("totalResources") },
  ]

  const detailColumns: ColumnDef<ResourceTypeDetail>[] = [
    { accessorKey: "domain", header: t("domain") },
    { id: "description", header: t("description"), cell: ({ row }) => row.original.description ?? "—" },
    {
      accessorKey: "total",
      header: t("amount"),
      cell: ({ row }) => <div className="text-right">{formatMoney(row.original.total, language, currency)}</div>,
    },
  ]

  if (summary.isLoading || servers.isLoading || vps.isLoading || storage.isLoading || monthsQuery.isLoading) {
    return <BareMetalSkeleton />
  }

  if (summary.isError || servers.isError || vps.isError || storage.isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
        {t("noDataAvailable")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          accent
          icon={HardDrivesIcon}
          label={t("bareMetalCost")}
          value={formatMoney(totalCost, language, currency)}
          sublabel={topResource ? `${t("topResourceType")}: ${topResource.name}` : t("selectedPeriod")}
        />
        <KpiCard icon={DesktopTowerIcon} label={t("dedicatedServers")} value={String(summary.data?.servers ?? 0)} sublabel={`${activeServers} ${t("active").toLowerCase()}`} />
        <KpiCard icon={DeviceMobileIcon} label={t("vpsInstances")} value={String(summary.data?.vps ?? 0)} sublabel={`${activeVps} ${t("active").toLowerCase()}`} />
        <KpiCard icon={DatabaseIcon} label={t("storageServices")} value={String(summary.data?.storage ?? 0)} sublabel={`${trackedResources} ${t("trackedResources").toLowerCase()}`} />
        <KpiCard icon={WarningIcon} label={t("expiringSoon")} value={String(summary.data?.expiring_soon ?? 0)} sublabel={t("next30Days")} />
      </div>

      <SectionCard title={t("bareMetalCostBreakdown")}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <DonutChart data={resourceRows.map((row) => ({ name: row.name, value: row.value, color: row.color }))} currency={currency} />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t("clickResourceType")}</p>
              <Badge variant="secondary" className="rounded-md">{formatMoney(totalCost, language, currency)}</Badge>
            </div>
            <DataTable<ResourceTypeBreakdown, unknown>
              columns={resourceTypeColumns}
              data={resourceRows}
              searchPlaceholder={t("resourceType")}
              onRowClick={(row) => setSelectedType(row.resource_type)}
            />
          </div>
        </div>
      </SectionCard>

      {selectedType && (
        <SectionCard title={selectedResource?.name ?? selectedType}>
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("amount")}</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(selectedResource?.value ?? 0, language, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("totalResources")}</p>
                <p className="mt-1 text-sm font-semibold">{selectedResource?.serviceCount ?? 0}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge variant="outline" className="rounded-md">{selectedResource?.detailsCount ?? 0} {t("billingLines")}</Badge>
              </div>
            </div>
            <DataTable<ResourceTypeDetail, unknown> columns={detailColumns} data={resourceTypeDetails.data ?? []} searchPlaceholder={t("domain")} />
          </div>
        </SectionCard>
      )}

      <SectionCard
        title={t("bareMetalInventory")}
        actions={<Badge variant="secondary" className="rounded-md">{trackedResources} {t("totalResources").toLowerCase()}</Badge>}
      >
        <Tabs defaultValue="servers">
          <TabsList>
            <TabsTrigger value="servers">{t("dedicatedServers")}</TabsTrigger>
            <TabsTrigger value="vps">{t("vpsInstances")}</TabsTrigger>
            <TabsTrigger value="storage">{t("storageServices")}</TabsTrigger>
          </TabsList>
          <TabsContent value="servers" className="mt-4">
            <DataTable<DedicatedServer, unknown> columns={serverCols} data={servers.data ?? []} searchPlaceholder={t("dedicatedServers")} />
          </TabsContent>
          <TabsContent value="vps" className="mt-4">
            <DataTable<VpsInstance, unknown> columns={vpsCols} data={vps.data ?? []} searchPlaceholder={t("vpsInstances")} />
          </TabsContent>
          <TabsContent value="storage" className="mt-4">
            <DataTable<StorageService, unknown> columns={storageCols} data={storage.data ?? []} searchPlaceholder={t("storageServices")} />
          </TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard title={t("bareMetalExpirations")}>
        <ExpiringAlerts services={expiring.data ?? []} />
      </SectionCard>
    </div>
  )
}
