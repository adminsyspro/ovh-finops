import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LanguageProvider } from "@/context/LanguageProvider"
import * as queries from "@/hooks/queries"

const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })

vi.mock("@/hooks/queries", () => {
  return {
    useMonths: vi.fn(() =>
      ok([
        { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
        { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
        { value: "2025-12", label: "Décembre 2025", from: "2025-12-01", to: "2025-12-31" },
      ]),
    ),
    useConfig: vi.fn(() => ok({ budget: 1000, currency: "EUR" })),
    useSummary: vi.fn((from: string | undefined) =>
      ok(
        from === "2026-05-01"
          ? { total: 500, cloudTotal: 400, nonCloudTotal: 100, dailyAverage: 16.1, billsCount: 3, projectsCount: 7, topProjects: [] }
          : from === "2025-01-01"
            ? { total: 3000, cloudTotal: 2400, nonCloudTotal: 600, dailyAverage: 8.2, billsCount: 12, projectsCount: 7, topProjects: [] }
          : { total: 400, cloudTotal: 320, nonCloudTotal: 80, dailyAverage: 13.3, billsCount: 2, projectsCount: 6, topProjects: [] },
      ),
    ),
    useByService: vi.fn((from: string | undefined) =>
      ok(
        from === "2026-05-01"
          ? [{ name: "Compute", value: 500, color: "#111", detailsCount: 1 }]
          : from === "2025-01-01"
            ? [{ name: "Compute", value: 3000, color: "#333", detailsCount: 12 }]
          : [{ name: "Compute", value: 400, color: "#222", detailsCount: 1 }],
      ),
    ),
    useByProject: vi.fn((from: string | undefined) =>
      ok(
        from === "2026-05-01"
          ? [{ projectId: "p1", projectName: "Proj One", total: 500, detailsCount: 1 }]
          : from === "2025-01-01"
            ? [{ projectId: "p1", projectName: "Proj One", total: 3000, detailsCount: 12 }]
          : [{ projectId: "p1", projectName: "Proj One", total: 400, detailsCount: 1 }],
      ),
    ),
  }
})

import { Compare } from "./Compare"

function wrap(ui: React.ReactNode) {
  return render(<LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>)
}

const { useMonths } = queries

beforeEach(() => {
  vi.mocked(useMonths).mockReturnValue(
    ok([
      { value: "2026-05", label: "Mai 2026", from: "2026-05-01", to: "2026-05-31" },
      { value: "2026-04", label: "Avril 2026", from: "2026-04-01", to: "2026-04-30" },
      { value: "2025-12", label: "Décembre 2025", from: "2025-12-01", to: "2025-12-31" },
    ]) as any,
  )
})

test("Compare: renders both month totals (400 for A, 500 for B)", () => {
  wrap(<Compare />)
  // monthA defaults to months[1]=2026-04 → total 400; monthB defaults to months[0]=2026-05 → total 500
  expect(screen.getAllByText(/400,00/).length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText(/500,00/).length).toBeGreaterThanOrEqual(1)
})

test("Compare: renders variation percentage and absolute delta amount", () => {
  wrap(<Compare />)
  // monthA=2026-04 total=400, monthB=2026-05 total=500 → (500-400)/400*100 = +25.0%
  expect(screen.getAllByText(/\+25,0%|\+25\.0%/).length).toBeGreaterThanOrEqual(1)
  // Absolute delta: 500 - 400 = 100 → "100,00" in French formatting
  expect(screen.getAllByText(/100,00/).length).toBeGreaterThanOrEqual(1)
})

test("Compare: renders merged project row 'Proj One'", () => {
  wrap(<Compare />)
  expect(screen.getByText("Proj One")).toBeInTheDocument()
})

test("Compare: renders KpiCard labels for Month A and Month B", () => {
  wrap(<Compare />)
  expect(screen.getAllByText("Mois A").length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText("Mois B").length).toBeGreaterThanOrEqual(1)
})

test("Compare: renders section titles", () => {
  wrap(<Compare />)
  expect(screen.getByText("Comparaison par service")).toBeInTheDocument()
  expect(screen.getByText("Comparaison par projet")).toBeInTheDocument()
})

test("Compare: allows selecting a full year", async () => {
  wrap(<Compare />)
  await userEvent.click(screen.getAllByRole("combobox")[0])
  await userEvent.click(screen.getByText("Année 2025"))
  expect(screen.getAllByText("Année 2025").length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText("Année 2026").length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText(/3 000,00|3 000,00/).length).toBeGreaterThanOrEqual(1)
  expect(queries.useSummary).toHaveBeenCalledWith("2025-01-01", "2025-12-31")
  expect(queries.useSummary).toHaveBeenCalledWith("2026-01-01", "2026-12-31")
})

test("Compare: empty state when no months", () => {
  vi.mocked(useMonths).mockReturnValueOnce({ data: [], isLoading: false, isError: false } as any)
  wrap(<Compare />)
  expect(screen.getByText("Pas de données disponibles pour cette période")).toBeInTheDocument()
})

test("Compare: two projects with same name but different projectId produce two separate rows", () => {
  const { useByProject } = queries
  vi.mocked(useByProject).mockImplementation((from: string | null | undefined) =>
    ok(
      from === "2026-04-01"
        ? [
            { projectId: "p1", projectName: "Dup", total: 10, detailsCount: 1 },
            { projectId: "p2", projectName: "Dup", total: 20, detailsCount: 1 },
          ]
        : [
            { projectId: "p1", projectName: "Dup", total: 15, detailsCount: 1 },
            { projectId: "p2", projectName: "Dup", total: 25, detailsCount: 1 },
          ],
    ) as any,
  )
  wrap(<Compare />)
  // Two distinct projects keyed by projectId must produce 2 rows, not 1 collapsed row
  expect(screen.getAllByText("Dup").length).toBeGreaterThanOrEqual(2)
})
