import { ProductList } from '@/features/products/components/product-list'

/** Página temporal de la Fase 0: verifica cliente API + Query + tokens. */
export function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="bg-primary px-4 py-5 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold">EstacionCafé</h1>
          <p className="text-sm text-surface">Fase 0 — base del proyecto</p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <h2 className="text-lg font-semibold text-primary">Productos activos</h2>
        <ProductList />
      </main>
    </div>
  )
}
