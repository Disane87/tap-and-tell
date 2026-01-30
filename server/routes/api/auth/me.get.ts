/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 * Relies on the auth middleware to populate event.context.user.
 */
export default defineEventHandler((event) => {
  const user = event.context.user

  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  return {
    success: true,
    data: user
  }
})
