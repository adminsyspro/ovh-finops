import { render, screen, within } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { ThemeProvider } from "@/context/ThemeProvider"
import { LanguageProvider } from "@/context/LanguageProvider"
import { routes } from "@/routes"

test("rend la sidebar et la page d'accueil", () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/"] })
  render(
    <ThemeProvider defaultTheme="light">
      <LanguageProvider defaultLanguage="fr">
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>,
  )
  expect(screen.getByText("Page à implémenter (phase suivante).")).toBeInTheDocument()
  expect(screen.getByText("Tendances")).toBeInTheDocument() // entrée de nav
})

test("breadcrumb résout une route imbriquée via startsWith (projects/:id)", () => {
  const router = createMemoryRouter(routes, { initialEntries: ["/projects/abc-123"] })
  render(
    <ThemeProvider defaultTheme="light">
      <LanguageProvider defaultLanguage="fr">
        <RouterProvider router={router} />
      </LanguageProvider>
    </ThemeProvider>,
  )
  // Assert specifically on the breadcrumb. With the current exact-match bug it shows the
  // "ovh-finops" fallback; matchNav's prefix-match must resolve it to "Projets".
  const crumb = within(screen.getByRole("navigation", { name: "breadcrumb" }))
  expect(crumb.getByText("Projets")).toBeInTheDocument()
  expect(crumb.queryByText("ovh-finops")).not.toBeInTheDocument()
})
