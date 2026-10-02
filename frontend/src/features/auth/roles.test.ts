import { homePathFor, safeRedirect } from './roles'

describe('safeRedirect', () => {
  it('usa el panel del rol sin destino o con destinos externos', () => {
    expect(safeRedirect(undefined, 'mesero')).toBe('/mesero/mesas')
    expect(safeRedirect('https://evil.com', 'admin')).toBe('/admin')
    expect(safeRedirect('//evil.com', 'admin')).toBe('/admin')
    expect(safeRedirect('/login', 'admin')).toBe('/admin')
  })

  it('no manda a un mesero a rutas de admin', () => {
    expect(safeRedirect('/admin/usuarios', 'mesero')).toBe(homePathFor('mesero'))
  })

  it('respeta destinos internos permitidos', () => {
    expect(safeRedirect('/admin/usuarios', 'admin')).toBe('/admin/usuarios')
    expect(safeRedirect('/mesero/historial', 'cajero')).toBe('/mesero/historial')
  })
})
