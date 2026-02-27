export const dashboardRoutes = {
  admin: '/dashboard/admin',
  analyst: '/dashboard/analyst',
  super_agent: '/dashboard/sa',
  franchise: '/dashboard/franchise',
  agent: '/dashboard/data-management'
} as const

export const getDashboardRoute = (role: string): string => {
  const route = dashboardRoutes[role as keyof typeof dashboardRoutes]

  if (!route) {
    console.warn(`No dashboard route found for role: ${role}, defaulting to /dashboard`)

    return '/dashboard'
  }

  return route
}
