import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function SectionCard({
  title, actions, className, children,
}: {
  title: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b pb-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {actions}
      </CardHeader>
      <CardContent className={cn("pt-0")}>{children}</CardContent>
    </Card>
  )
}
