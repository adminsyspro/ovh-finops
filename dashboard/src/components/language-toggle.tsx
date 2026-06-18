import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/LanguageProvider"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 bg-card px-2.5 text-xs"
      onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
    >
      {language.toUpperCase()}
    </Button>
  )
}
