import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "@/App"
import { ThemeProvider } from "@/context/ThemeProvider"
import { LanguageProvider } from "@/context/LanguageProvider"
import { PeriodProvider } from "@/context/PeriodContext"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider defaultLanguage="fr">
          <PeriodProvider>
            <App />
          </PeriodProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
