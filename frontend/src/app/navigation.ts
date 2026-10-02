import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  Receipt,
  ShoppingBag,
  Truck,
  User,
  Users,
  UtensilsCrossed,
  Wallet,
  Armchair,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }
export type NavGroup = { title: string; items: NavItem[] }

export const MESERO_NAV: NavItem[] = [
  { to: '/mesero/mesas', label: 'Mesas', icon: LayoutGrid },
  { to: '/mesero/para-llevar', label: 'Para llevar', icon: ShoppingBag },
  { to: '/mesero/historial', label: 'Historial', icon: Receipt },
  { to: '/mesero/perfil', label: 'Perfil', icon: User },
]

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'General',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/facturas', label: 'Facturas', icon: ClipboardList },
      { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
  {
    title: 'Catálogo',
    items: [{ to: '/admin/productos', label: 'Productos', icon: UtensilsCrossed }],
  },
  {
    title: 'Inventario',
    items: [
      { to: '/admin/inventario', label: 'Consumibles', icon: Boxes },
      { to: '/admin/proveedores', label: 'Proveedores', icon: Truck },
      { to: '/admin/compras', label: 'Compras', icon: Receipt },
    ],
  },
  {
    title: 'Operación',
    items: [
      { to: '/admin/mesas', label: 'Mesas y zonas', icon: Armchair },
      { to: '/admin/cajas', label: 'Cajas', icon: Wallet },
    ],
  },
  {
    title: 'Accesos',
    items: [{ to: '/admin/usuarios', label: 'Usuarios y roles', icon: Users }],
  },
]
