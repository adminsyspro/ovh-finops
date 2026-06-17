export function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
      <p className="text-lg font-medium text-foreground">{title}</p>
      <p className="text-sm">Page à implémenter (phase suivante).</p>
    </div>
  )
}
