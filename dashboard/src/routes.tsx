import { type RouteObject } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { Placeholder } from "@/pages/_Placeholder"
import { Overview } from "@/pages/Overview"
import { Trends } from "@/pages/Trends"
import { Projects } from "@/pages/Projects"
import { Services } from "@/pages/Services"
import { Compare } from "@/pages/Compare"

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/:id", element: <Placeholder title="Détail projet" /> },
      { path: "costs/services", element: <Services /> },
      { path: "compare", element: <Compare /> },
      { path: "trends", element: <Trends /> },
      { path: "consumption", element: <Placeholder title="Consommation" /> },
      { path: "inventory", element: <Placeholder title="Inventaire" /> },
      { path: "bills", element: <Placeholder title="Facturation" /> },
    ],
  },
]
