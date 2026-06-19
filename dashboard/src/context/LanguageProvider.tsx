import { createContext, useContext, useEffect, useState } from "react"
import { translations, type Lang } from "@/i18n/translations"

type LanguageCtx = { language: Lang; setLanguage: (l: Lang) => void; t: (key: string) => string }
const LanguageContext = createContext<LanguageCtx | null>(null)
const STORAGE_KEY = "ovh-dashboard-language"

export function LanguageProvider({
  children, defaultLanguage = "fr",
}: { children: React.ReactNode; defaultLanguage?: Lang }) {
  const [language, setLanguageState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === "fr" || saved === "en" ? saved : defaultLanguage
  })
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.cookie = `${STORAGE_KEY}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`
  }, [language])
  const t = (key: string) => translations[language]?.[key] || translations.fr?.[key] || key
  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageState, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider")
  return ctx
}
