import { Mail, Pencil, Phone, Plus, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '@/api/errors'
import { useListConsumablesBySupplier } from '@/api/generated/consumables/consumables'
import { useListPurchasesBySupplier } from '@/api/generated/purchases/purchases'
import { useGetSupplier } from '@/api/generated/suppliers/suppliers'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Stat } from '@/components/ui/stat'
import { UNIT_LABEL } from '@/features/inventory/units'
import { formatCurrency, formatDate, formatPhone, formatQuantity } from '@/lib/format'
import { SupplierActiveToggle } from '../components/supplier-active-toggle'
import { SupplierFormDialog } from '../components/supplier-form-dialog'

const BACK = '/admin/proveedores'

export function SupplierDetailPage() {
  const supplierId = Number(useParams().supplierId)
  const valid = Number.isInteger(supplierId) && supplierId > 0
  const supplier = useGetSupplier(supplierId, { query: { enabled: valid, select: (r) => r.data } })
  const consumables = useListConsumablesBySupplier(supplierId, {
    query: { enabled: valid, select: (r) => r.data },
  })
  const purchases = useListPurchasesBySupplier(supplierId, {
    query: { enabled: valid, select: (r) => r.data },
  })
  const [editing, setEditing] = useState(false)

  if (!valid || (supplier.error instanceof ApiError && supplier.error.status === 404))
    return (
      <>
        <PageHeader title="Proveedor" backTo={BACK} backLabel="Proveedores" />
        <EmptyState
          icon={Truck}
          title="Proveedor no encontrado"
          action={
            <Link to={BACK} className={buttonVariants({ variant: 'outline' })}>
              Ver proveedores
            </Link>
          }
        />
      </>
    )

  if (supplier.isPending)
    return (
      <>
        <PageHeader title="Proveedor" backTo={BACK} backLabel="Proveedores" />
        <Skeleton className="h-72" />
      </>
    )

  if (supplier.isError)
    return (
      <>
        <PageHeader title="Proveedor" backTo={BACK} backLabel="Proveedores" />
        <ErrorState message="No pudimos cargar el proveedor." onRetry={() => supplier.refetch()} />
      </>
    )

  const data = supplier.data
  const history = (purchases.data ?? []).toSorted((a, b) => b.date.localeCompare(a.date))
  const spent = history.reduce((acc, p) => acc + p.total, 0)

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={
          <Badge tone={data.active ? 'available' : 'neutral'}>
            {data.active ? 'Activo' : 'Inactivo'}
          </Badge>
        }
        backTo={BACK}
        backLabel="Proveedores"
        actions={
          <>
            <SupplierActiveToggle supplier={data} variant="outline" />
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil /> Editar
            </Button>
            {data.active ? (
              <Link
                to={`/admin/compras/nueva?proveedor=${data.supplierId}`}
                className={buttonVariants({ variant: 'accent' })}
              >
                <Plus /> Registrar compra
              </Link>
            ) : null}
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href={`tel:${data.phone}`}
          className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/40"
        >
          <Phone className="size-5 text-accent" aria-hidden="true" />
          <span className="font-semibold text-primary tabular-nums">{formatPhone(data.phone)}</span>
        </a>
        <a
          href={`mailto:${data.email}`}
          className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/40"
        >
          <Mail className="size-5 shrink-0 text-accent" aria-hidden="true" />
          <span className="truncate font-semibold text-primary">{data.email}</span>
        </a>
        <Stat label="Compras registradas" value={String(history.length)} />
        <Stat label="Total comprado" value={formatCurrency(spent)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <h2 className="border-b px-4 py-3 font-display text-lg font-semibold text-primary">
            Consumibles que surte
          </h2>
          {consumables.isPending ? (
            <Skeleton className="m-4 h-24" />
          ) : (consumables.data ?? []).length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground">Ninguno asignado.</p>
          ) : (
            <ul className="divide-y">
              {consumables.data!.map((c) => (
                <li
                  key={c.consumableId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="font-semibold text-primary">{c.name}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatQuantity(c.quantity)} {UNIT_LABEL[c.unitMeasurement]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <h2 className="border-b px-4 py-3 font-display text-lg font-semibold text-primary">
            Historial de compras
          </h2>
          {purchases.isPending ? (
            <Skeleton className="m-4 h-24" />
          ) : history.length === 0 ? (
            <p className="px-4 py-8 text-center text-muted-foreground">Sin compras todavía.</p>
          ) : (
            <ul className="divide-y">
              {history.map((p) => (
                <li key={p.purchaseId}>
                  <Link
                    to={`/admin/compras/${p.purchaseId}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-soft"
                  >
                    <span>
                      <span className="font-semibold text-primary">Compra #{p.purchaseId}</span>
                      <span className="block text-sm text-muted-foreground">
                        {formatDate(p.date)}
                      </span>
                    </span>
                    <span className="font-semibold text-primary tabular-nums">
                      {formatCurrency(p.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {editing ? <SupplierFormDialog supplier={data} onClose={() => setEditing(false)} /> : null}
    </>
  )
}
