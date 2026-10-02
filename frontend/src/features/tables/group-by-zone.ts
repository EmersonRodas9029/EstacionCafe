const byTableId = new Intl.Collator('es', { numeric: true })

/** Secciones por zona, mesas en orden natural (A2 antes que A10). */
export const groupByZone = <T extends { zone: string; tableId: string }>(tables: T[]) => {
  const zones = new Map<string, T[]>()
  for (const table of tables) zones.set(table.zone, [...(zones.get(table.zone) ?? []), table])
  return [...zones.entries()].map(
    ([zone, list]) =>
      [zone, list.toSorted((a, b) => byTableId.compare(a.tableId, b.tableId))] as const,
  )
}
