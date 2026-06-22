import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({ selectedMonth: "2026-05", setSelectedMonth: () => {} }),
}))

// Use vi.fn() so individual tests can override per-query behaviour
import * as queries from "@/hooks/queries"

vi.mock("@/hooks/queries", () => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  return {
    useMonths: vi.fn(() => ok([
      { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
      { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
    ])),
    useConfig: vi.fn(() => ok({ budget: 1000, currency: "EUR" })),
    useSummary: vi.fn((from: string) =>
      ok(
        from === "2026-05-01"
          ? { period: { from, to: "" }, total: 500, cloudTotal: 400, nonCloudTotal: 100, dailyAverage: 16.1, billsCount: 3, projectsCount: 7, topProjects: [] }
          : { period: { from, to: "" }, total: 400, cloudTotal: 320, nonCloudTotal: 80, dailyAverage: 13.3, billsCount: 2, projectsCount: 6, topProjects: [] },
      ),
    ),
    useByService: vi.fn(() => ok([{ name: "Compute", value: 400, color: "#123456", detailsCount: 1 }])),
    useByProject: vi.fn(() => ok([{ projectId: "p1", projectName: "Proj One", total: 400, detailsCount: 1 }])),
    useByResourceType: vi.fn(() => ok([{ name: "Public Cloud", resource_type: "cloud_project", value: 400, color: "#abcdef", detailsCount: 1, serviceCount: 2 }])),
    useServiceDetails: vi.fn(() => ok([])),
    useExpiring: vi.fn(() => ok([])),
  }
})

import { Overview } from "./Overview"

const { useMonths } = queries

beforeEach(() => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  vi.mocked(useMonths).mockReturnValue(ok([
    { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
    { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
  ]) as any)
})

test("Overview affiche les KPI et le delta vs mois précédent", () => {
  render(<LanguageProvider defaultLanguage="fr"><Overview /></LanguageProvider>)
  expect(screen.getByText("Coût total du mois")).toBeInTheDocument()
  expect(screen.getAllByText(/500,00 €/)[0]).toBeInTheDocument()   // total (KPI card)
  expect(screen.getByText("Projets actifs")).toBeInTheDocument()
  expect(screen.getByText("7")).toBeInTheDocument()           // projectsCount
  // (500-400)/400 = +25.0%
  expect(screen.getByText(/\+25\.0%/)).toBeInTheDocument()
  // "Compute" is in the by-service DonutChart's plain-DOM legend (reliable under jsdom),
  // unlike project names which only appear in the Recharts bar (not rendered at 0×0).
  expect(screen.getAllByText("Compute").length).toBeGreaterThanOrEqual(1)
})

test("months vide → empty state affiché, pas de skeleton ni KPI", () => {
  vi.mocked(useMonths).mockReturnValue({ data: [], isLoading: false, isError: false } as any)
  render(<LanguageProvider defaultLanguage="fr"><Overview /></LanguageProvider>)
  expect(screen.getByText("Pas de données disponibles pour cette période")).toBeInTheDocument()
  expect(screen.queryByText("Coût total du mois")).not.toBeInTheDocument()
})

test("months en cours de chargement → skeleton, pas de contenu", () => {
  vi.mocked(useMonths).mockReturnValue({ data: undefined, isLoading: true, isError: false } as any)
  render(<LanguageProvider defaultLanguage="fr"><Overview /></LanguageProvider>)
  expect(screen.queryByText("Coût total du mois")).not.toBeInTheDocument()
})
