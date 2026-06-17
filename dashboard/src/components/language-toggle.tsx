import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/LanguageProvider"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  return (
    <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "fr" ? "en" : "fr")}>
      {language.toUpperCase()}
    </Button>
  )
}
