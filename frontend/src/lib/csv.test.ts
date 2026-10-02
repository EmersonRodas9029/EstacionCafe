import { toCsv } from './csv'

describe('toCsv', () => {
  it('escapa comas, comillas y saltos de línea', () => {
    const csv = toCsv(
      [
        { name: 'Ana, María', note: 'dijo "hola"', total: 5 },
        { name: 'Luis', note: 'línea\nnueva', total: null },
      ],
      [
        { header: 'Cliente', value: (r) => r.name },
        { header: 'Nota', value: (r) => r.note },
        { header: 'Total', value: (r) => r.total },
      ],
    )
    expect(csv).toBe('Cliente,Nota,Total\r\n"Ana, María","dijo ""hola""",5\r\nLuis,"línea\nnueva",')
  })
})
