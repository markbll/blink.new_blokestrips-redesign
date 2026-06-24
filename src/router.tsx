import React from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router'
import { HomePage } from './pages/HomePage'
import { PackageTypePage } from './pages/PackageTypePage'
import { PackageDetailPage } from './pages/PackageDetailPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminPackages } from './pages/admin/AdminPackages'
import { AdminPackageForm } from './pages/admin/AdminPackageForm'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const packageTypeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/packages/$type',
  component: PackageTypePage,
})

const packageDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/packages/$type/$slug',
  component: PackageDetailPage,
})

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  component: AdminPackages,
})

const adminNewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/new',
  component: () => <AdminPackageForm />,
})

const adminEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/$id/edit',
  component: () => <AdminPackageForm />,
})

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminLayout,
})

adminLayoutRoute.addChildren([adminIndexRoute, adminNewRoute, adminEditRoute])

const routeTree = rootRoute.addChildren([
  indexRoute,
  packageTypeRoute,
  packageDetailRoute,
  adminLayoutRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />
}
