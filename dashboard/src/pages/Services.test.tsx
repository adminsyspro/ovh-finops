import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({ selectedMonth: "2026-05", setSelectedMonth: () => {} }),
}))

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/queries", () => {
  return {
    useMonths: vi.fn(() =>
      ok([{ value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" }]),
    ),
    useConfig: vi.fn(() => ok({ budget: 1000, currency: "EUR" })),
    useByService: vi.fn(() =>
      ok([{ name: "Compute", value: 400, color: "#123456", detailsCount: 1 }]),
    ),
    useByResourceType: vi.fn(() =>
      ok([
        {
          name: "Public Cloud",
          resource_type: "cloud_project",
          value: 400,
          color: "#abcdef",
          detailsCount: 1,
          serviceCount: 2,
        },
      ]),
    ),
    useResourceTypeDetails: vi.fn(() => ok([])),
  }
})

import { Services } from "./Services"
import * as queries from "@/hooks/queries"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

const { useMonths } = queries

test("Services page: renders by-service donut legend 'Compute'", () => {
  wrap(<Services />)
  expect(screen.getByText("Compute")).toBeInTheDocument()
})

test("Services page: renders resource-type row 'Public Cloud'", () => {
  wrap(<Services />)
  // "Public Cloud" appears in both the donut legend and the table row
  expect(screen.getAllByText("Public Cloud").length).toBeGreaterThanOrEqual(1)
})

test("Services page: renders section titles", () => {
  wrap(<Services />)
  expect(screen.getByText("Répartition par service")).toBeInTheDocument()
  expect(screen.getByText("Répartition par type de ressource")).toBeInTheDocument()
})

test("Services page: renders column headers", () => {
  wrap(<Services />)
  expect(screen.getByText("Type de ressource")).toBeInTheDocument()
  expect(screen.getByText("Total ressources")).toBeInTheDocument()
})

test("Services page: renders empty state when months list is empty", () => {
  vi.mocked(useMonths).mockReturnValueOnce({ data: [], isLoading: false, isError: false } as any)
  wrap(<Services />)
  expect(screen.getByText("Pas de données disponibles pour cette période")).toBeInTheDocument()
  expect(screen.queryByText("Répartition par service")).not.toBeInTheDocument()
})
