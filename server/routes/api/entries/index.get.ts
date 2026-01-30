/**
 * GET /api/entries
 * Returns all guest entries, newest first.
 */
export default defineEventHandler(() => {
  const entries = readEntries()
  return {
    success: true,
    data: entries
  }
})
