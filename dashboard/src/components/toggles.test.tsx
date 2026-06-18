import { fireEvent, render, screen } from "@testing-library/react"
import { LanguageProvider } from "@/context/LanguageProvider"
import { ThemeProvider } from "@/context/ThemeProvider"
import { LanguageToggle } from "./language-toggle"
import { ThemeToggle } from "./theme-toggle"

test("LanguageToggle: affiche un drapeau et change de langue", () => {
  render(
    <LanguageProvider defaultLanguage="fr">
      <LanguageToggle />
    </LanguageProvider>,
  )

  expect(screen.getByText("🇫🇷")).toBeInTheDocument()
  fireEvent.click(screen.getByRole("button", { name: /anglais/i }))
  expect(screen.getByText("🇬🇧")).toBeInTheDocument()
})

test("ThemeToggle: bascule entre light et dark", () => {
  render(
    <ThemeProvider defaultTheme="light">
      <ThemeToggle />
    </ThemeProvider>,
  )

  expect(document.documentElement.classList.contains("light")).toBe(true)
  fireEvent.click(screen.getByRole("button", { name: /sombre/i }))
  expect(document.documentElement.classList.contains("dark")).toBe(true)
  fireEvent.click(screen.getByRole("button", { name: /clair/i }))
  expect(document.documentElement.classList.contains("light")).toBe(true)
})
