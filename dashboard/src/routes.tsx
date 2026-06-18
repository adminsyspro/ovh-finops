import { type RouteObject } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { Placeholder } from "@/pages/_Placeholder"
import { Overview } from "@/pages/Overview"
import { Trends } from "@/pages/Trends"
import { Projects } from "@/pages/Projects"

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/:id", element: <Placeholder title="Détail projet" /> },
      { path: "costs/services", element: <Placeholder title="Par service" /> },
      { path: "compare", element: <Placeholder title="Comparaison" /> },
      { path: "trends", element: <Trends /> },
      { path: "consumption", element: <Placeholder title="Consommation" /> },
      { path: "inventory", element: <Placeholder title="Inventaire" /> },
      { path: "bills", element: <Placeholder title="Facturation" /> },
    ],
  },
]
