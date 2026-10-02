/** Caja efectiva: la preferida si sigue activa, o la única activa. */
export const resolveCashRegister = (
  registers: { cashRegisterId: number }[] | undefined,
  preferred: number | null,
) => {
  const list = registers ?? []
  if (list.some((r) => r.cashRegisterId === preferred)) return preferred
  return list.length === 1 ? list[0]!.cashRegisterId : null
}
