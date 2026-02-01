/**
 * GET /api/scopes
 * Returns the list of all available API scopes with descriptions.
 * Public endpoint for UI display.
 */
export default defineEventHandler(() => {
  return {
    success: true,
    data: ALL_SCOPES.map(scope => ({
      scope,
      description: SCOPE_DESCRIPTIONS[scope]
    }))
  }
})
