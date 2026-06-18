import { type RouteObject } from "react-router-dom"
import { AppLayout } from "@/layouts/AppLayout"
import { Overview } from "@/pages/Overview"
import { Trends } from "@/pages/Trends"
import { Projects } from "@/pages/Projects"
import { Services } from "@/pages/Services"
import { Compare } from "@/pages/Compare"
import { ProjectDetail } from "@/pages/ProjectDetail"
import { Inventory } from "@/pages/Inventory"
import { BareMetal } from "@/pages/BareMetal"
import { Billing } from "@/pages/Billing"
import { Profile } from "@/pages/Profile"
import { Users } from "@/pages/Users"

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/:id", element: <ProjectDetail /> },
      { path: "costs/services", element: <Services /> },
      { path: "compare", element: <Compare /> },
      { path: "trends", element: <Trends /> },
      { path: "inventory", element: <Inventory /> },
      { path: "bare-metal", element: <BareMetal /> },
      { path: "bills", element: <Billing /> },
      { path: "profile", element: <Profile /> },
      { path: "users", element: <Users /> },
    ],
  },
]
