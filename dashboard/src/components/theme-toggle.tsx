import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/ThemeProvider"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="bg-card"
      aria-label={resolvedTheme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
      title={resolvedTheme === "dark" ? "Thème clair" : "Thème sombre"}
      onClick={() => setTheme(nextTheme)}
    >
      {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
