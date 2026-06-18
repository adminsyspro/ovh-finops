import { vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { LanguageProvider } from "@/context/LanguageProvider"

vi.mock("@/hooks/useSelectedMonth", () => ({
  useSelectedMonth: () => ({
    from: "2026-05-01",
    to: "2026-05-31",
  }),
}))

vi.mock("@/hooks/queries", () => {
  const ok = <T,>(data: T) => ({ data, isLoading: false, isError: false })
  return {
    useProjectsEnriched: vi.fn(() =>
      ok([
        {
          id: "p1",
          name: "Alpha",
          description: null,
          status: "ok",
          instance_count: 3,
          consumption_total: 519.17,
          period_start: "2026-05-01",
          period_end: "2026-05-31",
        },
        {
          id: "p2",
          name: "Beta",
          description: "Second project",
          status: "suspended",
          instance_count: 0,
          consumption_total: 0,
          period_start: "2026-05-01",
          period_end: "2026-05-31",
        },
      ]),
    ),
    useConfig: vi.fn(() => ok({ budget: 1000, currency: "EUR" })),
  }
})

import { Projects } from "./Projects"

function wrap(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <LanguageProvider defaultLanguage="fr">{ui}</LanguageProvider>
    </MemoryRouter>,
  )
}

test("Projects page: renders both project names", () => {
  wrap(<Projects />)
  expect(screen.getByText("Alpha")).toBeInTheDocument()
  expect(screen.getByText("Beta")).toBeInTheDocument()
})

test("Projects page: renders formatted consumption for Alpha", () => {
  wrap(<Projects />)
  // fr-FR: 519.17 → "519,17 €"
  expect(screen.getByText(/519,17/)).toBeInTheDocument()
})

test("Projects page: renders status values", () => {
  wrap(<Projects />)
  expect(screen.getByText("ok")).toBeInTheDocument()
  expect(screen.getByText("suspended")).toBeInTheDocument()
})
