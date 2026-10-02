export type CsvColumn<T> = { header: string; value: (row: T) => string | number | null | undefined }

const escape = (value: string | number | null | undefined) => {
  const text = value == null ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** CSV con encabezados (RFC 4180). */
export const toCsv = <T>(rows: T[], columns: CsvColumn<T>[]) =>
  [
    columns.map((c) => escape(c.header)),
    ...rows.map((row) => columns.map((c) => escape(c.value(row)))),
  ]
    .map((cells) => cells.join(','))
    .join('\r\n')

/** Descarga el CSV; el BOM hace que Excel lea bien las tildes. */
export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
