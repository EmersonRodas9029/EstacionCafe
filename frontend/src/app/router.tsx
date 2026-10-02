import { createBrowserRouter, type RouteObject } from 'react-router'
import {
  GuestOnly,
  RequireAuth,
  RequireRole,
  RoleHomeRedirect,
} from '@/features/auth/components/route-guards'
import {
  ADMIN_IDLE_MS,
  IdleSession,
  OPERATION_IDLE_MS,
} from '@/features/auth/components/idle-session'
import { ADMIN_ROLES, OPERATION_ROLES } from '@/features/auth/roles'
import { ForbiddenPage } from './pages/forbidden-page'
import { NotFoundPage } from './pages/not-found-page'
import { RouteErrorPage } from './pages/route-error-page'
import { Root, Splash } from './root'

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
                // Equipos compartidos: 15 s sin tocar la pantalla cierran la sesión
                element: <IdleSession timeoutMs={OPERATION_IDLE_MS} />,
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
            ],
          },
          {
            path: 'admin',
            element: <RequireRole roles={ADMIN_ROLES} />,
            children: [
              {
                element: <IdleSession timeoutMs={ADMIN_IDLE_MS} />,
                children: [
                  {
                    lazy: async () => ({
                      Component: (await import('./layouts/admin-layout')).AdminLayout,
                    }),
                    children: [
                      {
                        index: true,
                        lazy: async () => ({
                          Component: (await import('@/features/dashboard/pages/dashboard-page'))
                            .DashboardPage,
                        }),
                      },
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
                      {
                        path: 'reportes',
                        lazy: async () => ({
                          Component: (await import('@/features/reports/pages/reports-page'))
                            .ReportsPage,
                        }),
                      },
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
                      {
                        path: 'inventario',
                        lazy: async () => ({
                          Component: (await import('@/features/inventory/pages/inventory-page'))
                            .InventoryPage,
                        }),
                      },
                      {
                        path: 'proveedores',
                        lazy: async () => ({
                          Component: (await import('@/features/suppliers/pages/suppliers-page'))
                            .SuppliersPage,
                        }),
                      },
                      {
                        path: 'proveedores/:supplierId',
                        lazy: async () => ({
                          Component: (
                            await import('@/features/suppliers/pages/supplier-detail-page')
                          ).SupplierDetailPage,
                        }),
                      },
                      {
                        path: 'compras',
                        lazy: async () => ({
                          Component: (await import('@/features/purchases/pages/purchases-page'))
                            .PurchasesPage,
                        }),
                      },
                      {
                        path: 'compras/nueva',
                        lazy: async () => ({
                          Component: (await import('@/features/purchases/pages/new-purchase-page'))
                            .NewPurchasePage,
                        }),
                      },
                      {
                        path: 'compras/:purchaseId',
                        lazy: async () => ({
                          Component: (
                            await import('@/features/purchases/pages/purchase-detail-page')
                          ).PurchaseDetailPage,
                        }),
                      },
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
                      {
                        path: 'dispositivos',
                        lazy: async () => ({
                          Component: (await import('@/features/devices/pages/devices-page'))
                            .DevicesPage,
                        }),
                      },
                      profile,
                    ],
                  },
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
