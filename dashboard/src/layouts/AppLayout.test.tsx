import { render, screen, within } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/context/ThemeProvider"
import { LanguageProvider } from "@/context/LanguageProvider"
import { PeriodProvider } from "@/context/PeriodContext"
import { routes } from "@/routes"

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <QueryClientProvider client={makeClient()}>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider defaultLanguage="fr">
          <PeriodProvider>
            <RouterProvider router={router} />
          </PeriodProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

test("rend la sidebar et la page d'accueil", () => {
  renderRoute("/")
  // Index route now renders Overview (with loading skeleton when selectedMonth is null)
  expect(screen.queryByText("Page à implémenter (phase suivante).")).not.toBeInTheDocument()
  expect(screen.getByText("Tendances")).toBeInTheDocument() // entrée de nav
})

test("breadcrumb résout une route imbriquée via startsWith (projects/:id)", () => {
  renderRoute("/projects/abc-123")
  // Assert specifically on the breadcrumb. With the current exact-match bug it shows the
  // "ovh-finops" fallback; matchNav's prefix-match must resolve it to "Projets".
  const crumb = within(screen.getByRole("navigation", { name: "Fil d'Ariane" }))
  expect(crumb.getByText("Projets")).toBeInTheDocument()
  expect(crumb.queryByText("ovh-finops")).not.toBeInTheDocument()
})

test("route alias /costs/compare ouvre la page Comparaison", () => {
  renderRoute("/costs/compare")
  const crumb = within(screen.getByRole("navigation", { name: "Fil d'Ariane" }))
  expect(crumb.getByText("Comparaison")).toBeInTheDocument()
})
