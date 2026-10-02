import { Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useListBills } from '@/api/generated/bills/bills'
import type { Bill } from '@/api/generated/model/bill'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { NewBillDialog } from '@/features/bills/components/new-bill-dialog'
import { useEditBill } from '@/features/bills/hooks/use-bill-actions'
import { LIVE_REFRESH_MS } from '@/features/bills/invalidate'
import { dayRange, localDay } from '@/lib/dates'
import { TakeawayCard } from '../components/takeaway-card'

type Stage = 'preparing' | 'ready' | 'delivered'

const STAGES: Record<Stage, { label: string; match: (b: Bill) => boolean; empty: string }> = {
  preparing: {
    label: 'En preparación',
    match: (b) => b.status === 'open' || b.status === 'draft',
    empty: 'No hay órdenes en preparación.',
  },
  ready: {
    label: 'Por entregar',
    match: (b) => b.status === 'closed',
    empty: 'No hay órdenes cobradas pendientes.',
  },
  delivered: {
    label: 'Entregadas',
    match: (b) => b.status === 'finished',
    empty: 'Aún no se entregan órdenes hoy.',
  },
}

export function TakeawayPage() {
  const [stage, setStage] = useState<Stage>('preparing')
  const [newOpen, setNewOpen] = useState(false)
  const range = dayRange(localDay())
  const bills = useListBills(
    { orderType: 'takeaway', ...range },
    { query: { refetchInterval: LIVE_REFRESH_MS, select: (r) => r.data } },
  )
  const editBill = useEditBill()

  const all = bills.data ?? []
  // Más antiguas primero: es el orden en que se preparan/entregan
  const visible = all.filter(STAGES[stage].match).toSorted((a, b) => a.date.localeCompare(b.date))

  const deliver = (bill: Bill) =>
    editBill.mutate(
      { id: bill.billId, data: { status: 'finished' } },
      { onSuccess: () => toast.success(`Orden de ${bill.customer} entregada`) },
    )

  return (
    <>
      <PageHeader
        title="Para llevar"
        subtitle="Órdenes de hoy"
        actions={
          <Button variant="accent" onClick={() => setNewOpen(true)}>
            <Plus /> Nueva orden
          </Button>
        }
      />

      <div className="mb-6">
        <ChipGroup<Stage>
          label="Etapa"
          value={stage}
          onChange={setStage}
          options={(Object.keys(STAGES) as Stage[]).map((key) => ({
            value: key,
            label: STAGES[key].label,
            count: all.filter(STAGES[key].match).length,
          }))}
        />
      </div>

      {bills.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : bills.isError ? (
        <ErrorState message="No pudimos cargar las órdenes." onRetry={() => bills.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={STAGES[stage].label}
          description={STAGES[stage].empty}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((bill) => (
            <li key={bill.billId}>
              <TakeawayCard
                bill={bill}
                onDeliver={() => deliver(bill)}
                delivering={editBill.isPending && editBill.variables?.id === bill.billId}
              />
            </li>
          ))}
        </ul>
      )}

      <NewBillDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        defaultName={`Orden ${all.length + 1}`}
      />
    </>
  )
}
