import { render, screen, act } from "@testing-library/react"
import { ThemeProvider, useTheme } from "./ThemeProvider"

function Probe() {
  const { theme, setTheme } = useTheme()
  return (
    <button onClick={() => setTheme("dark")}>theme:{theme}</button>
  )
}

test("applique la classe dark et persiste le choix", () => {
  render(
    <ThemeProvider defaultTheme="light">
      <Probe />
    </ThemeProvider>,
  )
  expect(document.documentElement.classList.contains("light")).toBe(true)
  act(() => screen.getByRole("button").click())
  expect(document.documentElement.classList.contains("dark")).toBe(true)
  expect(localStorage.getItem("ovh-finops-theme")).toBe("dark")
})
