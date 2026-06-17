import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void }

const ThemeProviderContext = createContext<ThemeCtx | null>(null)
const STORAGE_KEY = "ovh-finops-theme"

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme) || defaultTheme,
  )

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme
    root.classList.add(resolved)
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t)
    setThemeState(t)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}
