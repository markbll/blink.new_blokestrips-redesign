import React from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { HomePage }          from './pages/HomePage'
import { PackagesListPage }  from './pages/PackagesListPage'
import { PackageTypePage }   from './pages/PackageTypePage'
import { PackageDetailPage } from './pages/PackageDetailPage'
import { HowItWorksPage }    from './pages/HowItWorksPage'
import { HowItWorksVsPage } from './pages/HowItWorksVsPage'
import { ReviewsPage }       from './pages/ReviewsPage'
import { FranchisePage }     from './pages/FranchisePage'
import { PlanMyTripPage }    from './pages/PlanMyTripPage'
import { LegalPage }         from './pages/LegalPage'
import { NotFoundPage }      from './pages/NotFoundPage'
import { AdminLayout }       from './pages/admin/AdminLayout'
import { AdminDashboard }    from './pages/admin/AdminDashboard'
import { AdminPackages }     from './pages/admin/AdminPackages'
import { AdminPackageForm }  from './pages/admin/AdminPackageForm'
import { AdminEnquiries }    from './pages/admin/AdminEnquiries'

const rootRoute = createRootRoute({ component: () => <Outlet /> })

// Public routes
const indexRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/',             component: HomePage })
const packagesRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/packages',      component: PackagesListPage })
const packageTypeRoute  = createRoute({ getParentRoute: () => rootRoute, path: '/packages/$type', component: PackageTypePage })
const packageDetailRoute= createRoute({ getParentRoute: () => rootRoute, path: '/packages/$type/$slug', component: PackageDetailPage })
const howItWorksRoute   = createRoute({ getParentRoute: () => rootRoute, path: '/how-it-works',    component: HowItWorksVsPage })
const howItWorksOldRoute= createRoute({ getParentRoute: () => rootRoute, path: '/how-it-works-old', component: HowItWorksPage })
const reviewsRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/reviews',       component: ReviewsPage })
const franchiseRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/franchise',     component: FranchisePage })
const planMyTripRoute   = createRoute({ getParentRoute: () => rootRoute, path: '/plan-my-trip',  component: PlanMyTripPage })
const termsRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/terms',         component: () => <LegalPage type="terms" /> })
const privacyRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/privacy',       component: () => <LegalPage type="privacy" /> })
const cancellationRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cancellation',  component: () => <LegalPage type="cancellation" /> })
const notFoundRoute     = createRoute({ getParentRoute: () => rootRoute, path: '*',              component: NotFoundPage })

// Admin routes
const adminLayoutRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminLayout })

const adminIndexRoute    = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/',               component: AdminDashboard })
const adminLoginRoute    = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/login',
  beforeLoad: () => {
    // If token exists, redirect to dashboard
    if (localStorage.getItem('adminToken')) throw redirect({ to: '/admin' })
  },
  component: () => null, // AdminLayout handles the login form when unauthenticated
})
const adminPackagesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/packages',           component: AdminPackages })
const adminNewRoute      = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/packages/new',       component: () => <AdminPackageForm /> })
const adminEditRoute     = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/packages/$id/edit',  component: () => <AdminPackageForm /> })
const adminEnquiriesRoute= createRoute({ getParentRoute: () => adminLayoutRoute, path: '/enquiries',          component: AdminEnquiries })

adminLayoutRoute.addChildren([adminIndexRoute, adminLoginRoute, adminPackagesRoute, adminNewRoute, adminEditRoute, adminEnquiriesRoute])

const routeTree = rootRoute.addChildren([
  indexRoute, packagesRoute, packageTypeRoute, packageDetailRoute,
  howItWorksRoute, howItWorksOldRoute, reviewsRoute, franchiseRoute, planMyTripRoute,
  termsRoute, privacyRoute, cancellationRoute,
  adminLayoutRoute,
  notFoundRoute,
])

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

export function AppRouter() {
  return <RouterProvider router={router} />
}
