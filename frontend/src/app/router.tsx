import { createBrowserRouter, type RouteObject } from 'react-router'
import {
  GuestOnly,
  RequireAuth,
  RequireRole,
  RoleHomeRedirect,
} from '@/features/auth/components/route-guards'
import { ADMIN_ROLES, OPERATION_ROLES } from '@/features/auth/roles'
import { ComingSoonPage } from './pages/coming-soon-page'
import { ForbiddenPage } from './pages/forbidden-page'
import { NotFoundPage } from './pages/not-found-page'
import { RouteErrorPage } from './pages/route-error-page'
import { Root, Splash } from './root'

const soon = (path: string, title: string, phase: number): RouteObject => ({
  path,
  element: <ComingSoonPage title={title} phase={phase} />,
})

const profile: RouteObject = {
  path: 'perfil',
  lazy: async () => ({ Component: (await import('./pages/profile-page')).ProfilePage }),
}

export const routes: RouteObject[] = [
  {
    element: <Root />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <Splash />,
    children: [
      {
        element: <GuestOnly />,
        children: [
          {
            path: 'login',
            lazy: async () => ({ Component: (await import('./pages/login-page')).LoginPage }),
          },
        ],
      },
      { path: '403', element: <ForbiddenPage /> },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <RoleHomeRedirect /> },
          {
            path: 'mesero',
            element: <RequireRole roles={OPERATION_ROLES} />,
            children: [
              {
                // Fuera del layout: página limpia para imprimir
                path: 'cuentas/:billId/ticket',
                lazy: async () => ({
                  Component: (await import('@/features/bills/pages/ticket-page')).TicketPage,
                }),
              },
              {
                // Cada panel en su propio chunk
                lazy: async () => ({
                  Component: (await import('./layouts/mesero-layout')).MeseroLayout,
                }),
                children: [
                  { index: true, element: <RoleHomeRedirect /> },
                  {
                    path: 'mesas',
                    lazy: async () => ({
                      Component: (await import('@/features/tables/pages/tables-map-page'))
                        .TablesMapPage,
                    }),
                  },
                  {
                    path: 'mesas/:tableId',
                    lazy: async () => ({
                      Component: (await import('@/features/tables/pages/table-detail-page'))
                        .TableDetailPage,
                    }),
                  },
                  {
                    path: 'cuentas/:billId',
                    lazy: async () => ({
                      Component: (await import('@/features/bills/pages/bill-detail-page'))
                        .BillDetailPage,
                    }),
                  },
                  {
                    path: 'cuentas/:billId/orden',
                    lazy: async () => ({
                      Component: (await import('@/features/orders/pages/take-order-page'))
                        .TakeOrderPage,
                    }),
                  },
                  {
                    path: 'para-llevar',
                    lazy: async () => ({
                      Component: (await import('@/features/takeaway/pages/takeaway-page'))
                        .TakeawayPage,
                    }),
                  },
                  {
                    path: 'historial',
                    lazy: async () => ({
                      Component: (await import('@/features/history/pages/history-page'))
                        .HistoryPage,
                    }),
                  },
                  profile,
                ],
              },
            ],
          },
          {
            path: 'admin',
            element: <RequireRole roles={ADMIN_ROLES} />,
            children: [
              {
                lazy: async () => ({
                  Component: (await import('./layouts/admin-layout')).AdminLayout,
                }),
                children: [
                  { index: true, element: <ComingSoonPage title="Dashboard" phase={8} /> },
                  {
                    path: 'facturas',
                    lazy: async () => ({
                      Component: (await import('@/features/invoices/pages/invoices-page'))
                        .InvoicesPage,
                    }),
                  },
                  {
                    path: 'facturas/:billId',
                    lazy: async () => ({
                      Component: (await import('@/features/invoices/pages/invoice-detail-page'))
                        .InvoiceDetailPage,
                    }),
                  },
                  soon('reportes', 'Reportes', 8),
                  {
                    path: 'productos',
                    lazy: async () => ({
                      Component: (await import('@/features/products/pages/products-page'))
                        .ProductsPage,
                    }),
                  },
                  {
                    path: 'productos/nuevo',
                    lazy: async () => ({
                      Component: (await import('@/features/products/pages/product-form-page'))
                        .ProductFormPage,
                    }),
                  },
                  {
                    path: 'productos/:productId',
                    lazy: async () => ({
                      Component: (await import('@/features/products/pages/product-form-page'))
                        .ProductFormPage,
                    }),
                  },
                  soon('inventario', 'Consumibles', 7),
                  soon('proveedores', 'Proveedores', 7),
                  soon('compras', 'Compras', 7),
                  {
                    path: 'mesas',
                    lazy: async () => ({
                      Component: (await import('@/features/tables/pages/tables-admin-page'))
                        .TablesAdminPage,
                    }),
                  },
                  {
                    path: 'cajas',
                    lazy: async () => ({
                      Component: (
                        await import('@/features/cash-registers/pages/cash-registers-page')
                      ).CashRegistersPage,
                    }),
                  },
                  {
                    path: 'usuarios',
                    lazy: async () => ({
                      Component: (await import('@/features/users/pages/users-page')).UsersPage,
                    }),
                  },
                  profile,
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
