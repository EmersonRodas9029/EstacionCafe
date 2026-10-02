import { Construction } from 'lucide-react'

/** Marcador para vistas de fases siguientes; mantiene la navegación funcional. */
export function ComingSoonPage({ title, phase }: { title: string; phase: number }) {
  return (
    <section className="space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">{title}</h1>
      <div className="flex items-start gap-4 rounded-lg border border-dashed border-primary/25 bg-card p-6">
        <Construction className="size-6 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-muted-foreground">Esta vista llega en la fase {phase} del plan.</p>
      </div>
    </section>
  )
}
