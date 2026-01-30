/**
 * Global client-side route guard for authenticated pages.
 * Redirects unauthenticated users to /login for protected routes.
 * Redirects authenticated users away from /login and /register.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { isAuthenticated, fetchMe, initialized } = useAuth()

  // Ensure auth state is initialized
  if (!initialized.value) {
    await fetchMe()
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  const isProtected = protectedRoutes.some(route => to.path.startsWith(route))

  // Auth pages that should redirect if already logged in
  const authPages = ['/login', '/register']
  const isAuthPage = authPages.includes(to.path)

  if (isProtected && !isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (isAuthPage && isAuthenticated.value) {
    return navigateTo('/dashboard')
  }
})
