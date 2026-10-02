import { ArrowLeft, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useListBillDetailsByBill } from '@/api/generated/bill-details/bill-details'
import { useGetBill } from '@/api/generated/bills/bills'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ErrorState } from '@/components/ui/state'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { isActive, PAYMENT_LABEL } from '../bill-status'

/** Pre-cuenta (abierta) o ticket (cobrada) listo para impresora térmica de 80 mm. */
export function TicketPage() {
  const billId = Number(useParams().billId)
  const bill = useGetBill(billId, { query: { select: (r) => r.data } })
  const lines = useListBillDetailsByBill(billId, { query: { select: (r) => r.data } })

  if (bill.isError || lines.isError) return <ErrorState message="No pudimos cargar el ticket." />
  if (!bill.data || !lines.data) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    )
  }

  const data = bill.data
  const total = lines.data.reduce((acc, l) => acc + l.subTotal, 0)
  // Mientras no se cobre (abierta o por cobrar) es pre-cuenta
  const preBill = isActive(data.status)
  const voided = data.status === 'void'

  return (
    <div className="min-h-dvh bg-surface-soft py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[80mm] justify-between gap-2 px-2 print:hidden">
        <Link
          to={`/mesero/cuentas/${billId}`}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver
        </Link>
        <Button variant="accent" onClick={() => window.print()}>
          <Printer /> Imprimir
        </Button>
      </div>

      <article
        aria-label={preBill ? 'Pre-cuenta' : 'Ticket'}
        className="ticket mx-auto w-[80mm] bg-white px-5 py-6 font-mono text-[12px] leading-relaxed text-black shadow-md print:shadow-none"
      >
        <header className="mb-3 text-center">
          <p className="font-sans text-base font-bold">EstaciónCafé</p>
          <p>
            {voided
              ? '*** ANULADA ***'
              : preBill
                ? 'PRE-CUENTA · NO VÁLIDO COMO FACTURA'
                : 'TICKET DE VENTA'}
          </p>
        </header>

        <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 border-y border-dashed border-black py-2">
          <dt>Orden</dt>
          <dd className="text-right">#{data.billId}</dd>
          <dt>Fecha</dt>
          <dd className="text-right">{formatDateTime(data.date)}</dd>
          <dt>{data.tableId ? 'Mesa' : 'Tipo'}</dt>
          <dd className="text-right">{data.tableId ?? 'Para llevar'}</dd>
          <dt>Cliente</dt>
          <dd className="text-right">{data.customer}</dd>
          {data.waiter ? (
            <>
              <dt>Atendió</dt>
              <dd className="text-right">{data.waiter.username}</dd>
            </>
          ) : null}
          {data.cashRegister ? (
            <>
              <dt>Caja</dt>
              <dd className="text-right">{data.cashRegister.number}</dd>
            </>
          ) : null}
          {data.paymentMethod ? (
            <>
              <dt>Pago</dt>
              <dd className="text-right">{PAYMENT_LABEL[data.paymentMethod]}</dd>
            </>
          ) : null}
        </dl>

        <table className="w-full">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left font-normal">Cant · Producto</th>
              <th className="text-right font-normal">Importe</th>
            </tr>
          </thead>
          <tbody>
            {lines.data.map((line) => (
              <tr key={line.billDetailId} className="align-top">
                <td className="py-0.5 pr-2">
                  {line.quantity} × {line.name}
                  <br />
                  <span className="text-[11px]">@ {formatCurrency(line.price)}</span>
                </td>
                <td className="py-0.5 text-right">{formatCurrency(line.subTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 flex justify-between border-t border-dashed border-black pt-2 text-[15px] font-bold">
          <span>TOTAL</span>
          <span>{formatCurrency(total)}</span>
        </p>
        <p className="mt-4 text-center">¡Gracias por su visita!</p>
      </article>
    </div>
  )
}
