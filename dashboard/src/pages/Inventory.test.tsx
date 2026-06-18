import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/queries", () => ({
  useInventorySummary: vi.fn(() =>
    ok({ servers: 3, vps: 5, storage: 2, cloud_projects: 4, total: 14, expiring_soon: 1 }),
  ),
  useInventoryServers: vi.fn(() =>
    ok([
      {
        id: "srv-1",
        display_name: "ns1",
        reverse: null,
        datacenter: "GRA1",
        os: "Debian",
        state: "ok",
        cpu: "Intel Xeon E5",
        ram_size: 65536,
        disk_info: [],
        bandwidth: 1000,
        expiration_date: "2026-12-01",
        renewal_type: "automatic",
        imported_at: "2026-06-18",
      },
    ]),
  ),
  useInventoryVps: vi.fn(() =>
    ok([
      {
        id: "vps-1",
        display_name: "vps1",
        model: "VPS2018-SSD-2",
        zone: "GRA",
        state: "running",
        os: "Ubuntu",
        vcpus: 2,
        ram_mb: 4096,
        disk_gb: 40,
        expiration_date: "2026-11-01",
        renewal_type: "automatic",
        ip_addresses: [],
        imported_at: "2026-06-18",
      },
    ]),
  ),
  useInventoryStorage: vi.fn(() =>
    ok([
      {
        id: "nfs-1",
        service_type: "NAS",
        display_name: "nfs1",
        region: "SBG",
        total_size_gb: 2000,
        used_size_gb: 500,
        share_count: 3,
        expiration_date: "2026-10-01",
        imported_at: "2026-06-18",
      },
    ]),
  ),
  useExpiring: vi.fn(() => ok([])),
}))

import { Inventory } from "./Inventory"
import * as queries from "@/hooks/queries"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("Inventory page: renders summary KPI count for servers (3)", () => {
  wrap(<Inventory />)
  // KpiCard for dedicatedServers shows "3"
  expect(screen.getByText("3")).toBeInTheDocument()
})

test("Inventory page: renders 'Serveurs dédiés' tab trigger", () => {
  wrap(<Inventory />)
  expect(screen.getAllByText("Serveurs dédiés").length).toBeGreaterThanOrEqual(1)
})

test("Inventory page: active tab (servers) shows 'ns1' row", () => {
  wrap(<Inventory />)
  expect(screen.getByText("ns1")).toBeInTheDocument()
})

test("Inventory page: renders VPS tab trigger", () => {
  wrap(<Inventory />)
  expect(screen.getAllByText("VPS").length).toBeGreaterThanOrEqual(1)
})

test("Inventory page: renders Stockage tab trigger", () => {
  wrap(<Inventory />)
  expect(screen.getAllByText("Stockage").length).toBeGreaterThanOrEqual(1)
})

test("Inventory page: loading state shows skeleton, not content", () => {
  vi.mocked(queries.useInventorySummary).mockReturnValueOnce({
    data: undefined,
    isLoading: true,
    isError: false,
  } as any)
  wrap(<Inventory />)
  expect(screen.queryByText("Serveurs dédiés")).not.toBeInTheDocument()
})

test("Inventory page: error state shows destructive block", () => {
  vi.mocked(queries.useInventorySummary).mockReturnValueOnce({
    data: undefined,
    isLoading: false,
    isError: true,
  } as any)
  wrap(<Inventory />)
  expect(screen.getByText("Pas de données disponibles pour cette période")).toBeInTheDocument()
})
