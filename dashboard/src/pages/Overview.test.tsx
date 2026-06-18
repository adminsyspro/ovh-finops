import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/context/PeriodContext", () => ({
  usePeriod: () => ({ selectedMonth: "2026-05", setSelectedMonth: () => {} }),
}))

vi.mock("@/hooks/queries", () => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  return {
    useMonths: () => ok([
      { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
      { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
    ]),
    useConfig: () => ok({ budget: 1000, currency: "EUR" }),
    useSummary: (from: string) =>
      ok(
        from === "2026-05-01"
          ? { period: { from, to: "" }, total: 500, cloudTotal: 400, nonCloudTotal: 100, dailyAverage: 16.1, billsCount: 3, projectsCount: 7, topProjects: [] }
          : { period: { from, to: "" }, total: 400, cloudTotal: 320, nonCloudTotal: 80, dailyAverage: 13.3, billsCount: 2, projectsCount: 6, topProjects: [] },
      ),
    useByService: () => ok([{ name: "Compute", value: 400, color: "#123456", detailsCount: 1 }]),
    useByProject: () => ok([{ projectId: "p1", projectName: "Proj One", total: 400, detailsCount: 1 }]),
    useByResourceType: () => ok([{ name: "Public Cloud", resource_type: "cloud_project", value: 400, color: "#abcdef", detailsCount: 1, serviceCount: 2 }]),
    useExpiring: () => ok([]),
  }
})

import { Overview } from "./Overview"

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
  expect(screen.getByText("Compute")).toBeInTheDocument()
})
