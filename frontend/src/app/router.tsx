import { createBrowserRouter } from 'react-router'
import { HomePage } from './pages/home-page'
import { NotFoundPage } from './pages/not-found-page'
import { RouteErrorPage } from './pages/route-error-page'

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
