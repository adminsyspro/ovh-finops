import { render, screen } from "@testing-library/react"
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
