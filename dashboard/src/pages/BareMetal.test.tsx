import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LanguageProvider } from "@/context/LanguageProvider"

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/useSelectedMonth", () => ({
  useSelectedMonth: vi.fn(() => ({
    monthsQuery: { isLoading: false, isError: false },
    from: "2026-06-01",
    to: "2026-06-30",
  })),
}))

vi.mock("@/hooks/queries", () => ({
  useConfig: vi.fn(() => ok({ budget: null, currency: "EUR" })),
  useInventorySummary: vi.fn(() => ok({ servers: 2, vps: 1, storage: 3, cloud_projects: 4, total: 10, expiring_soon: 1 })),
  useInventoryServers: vi.fn(() =>
    ok([
      {
        id: "srv-1",
        display_name: "ns1",
        reverse: null,
        datacenter: "GRA1",
        os: "Debian",
        state: "ok",
        cpu: "Intel Xeon",
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
        model: "VPS",
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
        id: "storage-1",
        service_type: "NAS",
        display_name: "nas1",
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
  useByResourceType: vi.fn(() =>
    ok([
      { name: "Dedicated Servers", resource_type: "dedicated_server", value: 150, color: "#ef4444", detailsCount: 3, serviceCount: 2 },
      { name: "Public Cloud", resource_type: "cloud_project", value: 999, color: "#3b82f6", detailsCount: 9, serviceCount: 4 },
    ]),
  ),
  useResourceTypeDetails: vi.fn(() => ok([
    { domain: "ns1.example", description: "Dedicated server rental", total: 150, line_count: 3 },
    { domain: "backup.example", description: "Backup storage", total: 25, line_count: 1 },
  ])),
}))

import { BareMetal } from "./BareMetal"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("BareMetal page: renders bare metal KPIs and inventory tabs", () => {
  wrap(<BareMetal />)
  expect(screen.getByText("Coût Bare Metal")).toBeInTheDocument()
  expect(screen.getAllByText("150,00 €").length).toBeGreaterThan(0)
  expect(screen.getAllByText("Serveurs dédiés").length).toBeGreaterThanOrEqual(1)
  expect(screen.getByText("ns1")).toBeInTheDocument()
})

test("BareMetal page: opens resource type detail sheet", async () => {
  wrap(<BareMetal />)
  await userEvent.click(screen.getAllByText("Dedicated Servers")[0])
  expect(screen.getByText("Détail du type de ressource · Dedicated Servers")).toBeInTheDocument()
  expect(screen.getByText("ns1.example")).toBeInTheDocument()
  expect(screen.getByPlaceholderText("Rechercher une ligne")).toBeInTheDocument()
  await userEvent.type(screen.getByPlaceholderText("Rechercher une ligne"), "backup")
  expect(screen.queryByText("ns1.example")).not.toBeInTheDocument()
  expect(screen.getByText("backup.example")).toBeInTheDocument()
})
