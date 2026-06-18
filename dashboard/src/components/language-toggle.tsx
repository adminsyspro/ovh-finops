import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/LanguageProvider"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const nextLanguage = language === "fr" ? "en" : "fr"
  const flag = language === "fr" ? "🇫🇷" : "🇬🇧"
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="bg-card text-base leading-none"
      aria-label={language === "fr" ? "Changer la langue en anglais" : "Switch language to French"}
      title={language === "fr" ? "Français" : "English"}
      onClick={() => setLanguage(nextLanguage)}
    >
      <span aria-hidden="true">{flag}</span>
    </Button>
  )
}
