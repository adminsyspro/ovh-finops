import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({ from: "2026-01-01", to: "2026-06-18" }),
}))

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/queries", () => ({
  useConsumptionCurrent: vi.fn(() =>
    ok({
      current_total: 1234.5,
      currency: "EUR",
      source: "cloud_projects",
      project_count: 3,
    }),
  ),
  useConsumptionForecast: vi.fn(() =>
    ok({
      forecast_total: 2000,
      current_total: 1234.5,
      currency: "EUR",
      progress: 61,
    }),
  ),
  useConsumptionHistory: vi.fn(() =>
    ok([
      { period_start: "2026-05-01", period_end: "2026-05-31", total: 500, currency: "EUR", service_type: "compute" },
      { period_start: "2026-05-01", period_end: "2026-05-31", total: 200, currency: "EUR", service_type: "storage" },
    ]),
  ),
}))

import { Consumption } from "./Consumption"
import * as queries from "@/hooks/queries"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

test("Consumption page: currentConsumption label is present", () => {
  wrap(<Consumption />)
  expect(screen.getByText("Consommation en cours")).toBeInTheDocument()
})

test("Consumption page: formatted current_total is present", () => {
  wrap(<Consumption />)
  // 1234.50 → fr: "1 234,50 €" or "1234,50 €" (tolerant of thousands separator)
  expect(screen.getByText(/1\s?234,50/)).toBeInTheDocument()
})

test("Consumption page: forecastEndOfMonth label is present", () => {
  wrap(<Consumption />)
  // "Prévision fin de mois" appears as KpiCard label (may appear more than once — as label + sublabel)
  expect(screen.getAllByText("Prévision fin de mois").length).toBeGreaterThanOrEqual(1)
})

test("Consumption page: consumptionHistory section is present", () => {
  wrap(<Consumption />)
  expect(screen.getByText("Historique de consommation")).toBeInTheDocument()
})

test("Consumption page: cloud_projects sublabel shows project count", () => {
  wrap(<Consumption />)
  // sublabel: "Public Cloud · 3 Projets Cloud"
  expect(screen.getByText(/Public Cloud · 3/)).toBeInTheDocument()
})

test("Consumption page: loading state shows skeleton", () => {
  vi.mocked(queries.useConsumptionCurrent).mockReturnValueOnce({
    data: undefined,
    isLoading: true,
    isError: false,
  } as any)
  wrap(<Consumption />)
  // Should not show currentConsumption label when loading
  expect(screen.queryByText("Consommation en cours")).not.toBeInTheDocument()
})

test("Consumption page: error state shows destructive block", () => {
  vi.mocked(queries.useConsumptionCurrent).mockReturnValueOnce({
    data: undefined,
    isLoading: false,
    isError: true,
  } as any)
  wrap(<Consumption />)
  expect(screen.getByText("Pas de données disponibles pour cette période")).toBeInTheDocument()
})

test("Consumption page: forecast_total is present", () => {
  wrap(<Consumption />)
  // 2000 → fr: "2 000,00 €"
  expect(screen.getByText(/2\s?000,00/)).toBeInTheDocument()
})
