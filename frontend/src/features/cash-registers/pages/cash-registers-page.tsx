import { Pencil, Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useListCashRegisters } from '@/api/generated/cash-registers/cash-registers'
import type { CashRegister } from '@/api/generated/model/cashRegister'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { cn } from '@/lib/utils'
import { CashRegisterDialog } from '../components/cash-register-dialog'
import { useEditCashRegister } from '../hooks'

function ActiveToggle({ cashRegister }: { cashRegister: CashRegister }) {
  const edit = useEditCashRegister()
  const next = !cashRegister.active
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={edit.isPending}
      aria-label={`${next ? 'Activar' : 'Desactivar'} caja ${cashRegister.number}`}
      onClick={() =>
        edit.mutate(
          { id: cashRegister.cashRegisterId, data: { active: next } },
          {
            onSuccess: () =>
              toast.success(`Caja ${cashRegister.number} ${next ? 'activada' : 'desactivada'}`),
          },
        )
      }
    >
      {next ? 'Activar' : 'Desactivar'}
    </Button>
  )
}

export function CashRegistersPage() {
  const registers = useListCashRegisters({ query: { select: (r) => r.data } })
  const [dialog, setDialog] = useState<{ register?: CashRegister } | null>(null)

  const all = registers.data ?? []
  const active = all.filter((r) => r.active).length

  return (
    <>
      <PageHeader
        title="Cajas registradoras"
        subtitle={
          registers.data
            ? `Activas: ${active} de ${all.length}. Solo las activas aparecen al cobrar.`
            : undefined
        }
        actions={
          <Button variant="accent" onClick={() => setDialog({})}>
            <Plus /> Nueva caja
          </Button>
        }
      />

      {registers.isPending ? (
        <Skeleton className="h-48" />
      ) : registers.isError ? (
        <ErrorState message="No pudimos cargar las cajas." onRetry={() => registers.refetch()} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin cajas"
          description="Crea al menos una para poder cobrar cuentas."
        />
      ) : (
        <>
          {active === 0 ? (
            <p
              role="alert"
              className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-destructive"
            >
              No hay cajas activas: nadie puede cobrar hasta que actives una.
            </p>
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((register) => (
              <li
                key={register.cashRegisterId}
                className={cn(
                  'space-y-3 rounded-lg border bg-card p-4',
                  !register.active && 'bg-muted/40',
                )}
              >
                <div className="flex items-center gap-3">
                  <Wallet
                    className={cn(
                      'size-8 shrink-0',
                      register.active ? 'text-accent' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                  <p className="min-w-0 flex-1 truncate font-display text-xl font-semibold text-primary">
                    Caja {register.number}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar caja ${register.number}`}
                    onClick={() => setDialog({ register })}
                  >
                    <Pencil />
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={register.active ? 'available' : 'neutral'}>
                    {register.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <ActiveToggle cashRegister={register} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {dialog ? (
        <CashRegisterDialog register={dialog.register} onClose={() => setDialog(null)} />
      ) : null}
    </>
  )
}
