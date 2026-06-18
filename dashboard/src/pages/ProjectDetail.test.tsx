import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { LanguageProvider } from "@/context/LanguageProvider"

// Mock useParams while keeping MemoryRouter / other exports intact
vi.mock("react-router-dom", async (orig) => ({
  ...(await orig<typeof import("react-router-dom")>()),
  useParams: () => ({ id: "p1" }),
}))

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({ selectedMonth: "2026-05", setSelectedMonth: () => {} }),
}))

import * as queries from "@/hooks/queries"

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/queries", () => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  return {
    useMonths: vi.fn(() =>
      ok([
        { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
      ]),
    ),
    useConfig: vi.fn(() => ok({ budget: 1000, currency: "EUR" })),
    useProjectInstances: vi.fn(() =>
      ok([
        {
          id: "i1",
          project_id: "p1",
          name: "vm-1",
          flavor: "b2-7",
          plan_code: null,
          region: "GRA",
          status: "ACTIVE",
          created_at: "2026-01-01T00:00:00Z",
          monthly_billing: 10,
          imported_at: "2026-05-01T00:00:00Z",
        },
      ]),
    ),
    useProjectQuotas: vi.fn(() =>
      ok([
        {
          id: 1,
          project_id: "p1",
          region: "GRA",
          max_cores: 10,
          max_instances: 4,
          max_ram_mb: 20480,
          used_cores: 5,
          used_instances: 2,
          used_ram_mb: 8192,
          snapshot_date: "2026-05-01",
        },
      ]),
    ),
    useProjectBuckets: vi.fn(() =>
      ok([
        { name: "bucket-x", type: "Standard", total: 12.5 },
      ]),
    ),
    useProjectConsumption: vi.fn(() =>
      ok([
        {
          id: 1,
          project_id: "p1",
          period_start: "2026-05-01",
          period_end: "2026-05-31",
          resource_type: "instances",
          resource_id: null,
          resource_name: "vm-1",
          quantity: 1,
          unit: "hour",
          unit_price: 30,
          total_price: 30,
          region: "GRA",
          imported_at: "2026-05-01T00:00:00Z",
        },
      ]),
    ),
    useProjectInstanceTotal: vi.fn(() => ok({ total: 42.5 })),
    useProjectsEnriched: vi.fn(() =>
      ok([
        {
          id: "p1",
          name: "My Project",
          description: null,
          status: "ok",
          instance_count: 1,
          consumption_total: 42.5,
          period_start: "2026-05-01",
          period_end: "2026-05-31",
        },
      ]),
    ),
  }
})

import { ProjectDetail } from "./ProjectDetail"

function wrap(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(queries.useMonths).mockReturnValue(
    ok([{ value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" }]) as any,
  )
})

test("ProjectDetail: renders project name in header", () => {
  wrap(<ProjectDetail />)
  expect(screen.getByText("My Project")).toBeInTheDocument()
})

test("ProjectDetail: renders instance name in table", () => {
  wrap(<ProjectDetail />)
  expect(screen.getByText("vm-1")).toBeInTheDocument()
})

test("ProjectDetail: renders bucket name in table", () => {
  wrap(<ProjectDetail />)
  expect(screen.getByText("bucket-x")).toBeInTheDocument()
})

test("ProjectDetail: renders instance-total formatted money", () => {
  wrap(<ProjectDetail />)
  // 42.5 EUR in fr locale → "42,50 €"
  expect(screen.getByText(/42,50/)).toBeInTheDocument()
})

test("ProjectDetail: renders quota region GRA", () => {
  wrap(<ProjectDetail />)
  // GRA appears in both the instances table region column and the quota card — getAllByText handles both
  expect(screen.getAllByText("GRA").length).toBeGreaterThan(0)
})
