import { Pencil, Plus, Search, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { Supplier } from '@/api/generated/model/supplier'
import { useListSuppliers } from '@/api/generated/suppliers/suppliers'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { formatPhone } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SupplierActiveToggle } from '../components/supplier-active-toggle'
import { SupplierFormDialog } from '../components/supplier-form-dialog'

type StatusFilter = 'active' | 'inactive' | 'all'

export function SuppliersPage() {
  const suppliers = useListSuppliers({ query: { select: (r) => r.data } })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [dialog, setDialog] = useState<{ supplier?: Supplier } | null>(null)

  const all = useMemo(() => suppliers.data ?? [], [suppliers.data])
  const activeCount = all.filter((s) => s.active).length
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const digits = query.replace(/\D/g, '')
    return all
      .filter(
        (s) =>
          (status === 'all' || s.active === (status === 'active')) &&
          (!query ||
            `${s.name} ${s.email}`.toLowerCase().includes(query) ||
            (digits.length > 2 && s.phone.includes(digits))),
      )
      .toSorted((a, b) => a.name.localeCompare(b.name))
  }, [all, search, status])

  return (
    <>
      <PageHeader
        title="Proveedores"
        subtitle={suppliers.data ? `${activeCount} activos de ${all.length}` : undefined}
        actions={
          <Button variant="accent" onClick={() => setDialog({})}>
            <Plus /> Nuevo proveedor
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar proveedor"
            placeholder="Nombre, correo o teléfono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <ChipGroup
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Activos', count: activeCount },
            { value: 'inactive', label: 'Inactivos', count: all.length - activeCount },
            { value: 'all', label: 'Todos', count: all.length },
          ]}
        />
      </div>

      {suppliers.isPending ? (
        <Skeleton className="h-64" />
      ) : suppliers.isError ? (
        <ErrorState
          message="No pudimos cargar los proveedores."
          onRetry={() => suppliers.refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={all.length === 0 ? 'Aún no hay proveedores' : 'Sin resultados'}
          description={
            all.length === 0
              ? 'Registra a quién le compras tus insumos.'
              : 'Prueba con otro filtro.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="w-full px-4 py-3 font-semibold">
                  Proveedor
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Teléfono
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((supplier) => (
                <tr key={supplier.supplierId} className={cn(!supplier.active && 'bg-muted/40')}>
                  <td className="max-w-0 px-4 py-3">
                    <Link
                      to={`/admin/proveedores/${supplier.supplierId}`}
                      className="block truncate font-semibold text-primary hover:text-accent-strong"
                    >
                      {supplier.name}
                    </Link>
                    <p className="truncate text-muted-foreground">{supplier.email}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {formatPhone(supplier.phone)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 whitespace-nowrap tabular-nums sm:table-cell">
                    <a href={`tel:${supplier.phone}`} className="hover:text-accent-strong">
                      {formatPhone(supplier.phone)}
                    </a>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <Badge tone={supplier.active ? 'available' : 'neutral'}>
                      {supplier.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end gap-1">
                      <SupplierActiveToggle supplier={supplier} className="hidden sm:inline-flex" />
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Editar ${supplier.name}`}
                        onClick={() => setDialog({ supplier })}
                      >
                        <Pencil />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog ? (
        <SupplierFormDialog supplier={dialog.supplier} onClose={() => setDialog(null)} />
      ) : null}
    </>
  )
}
