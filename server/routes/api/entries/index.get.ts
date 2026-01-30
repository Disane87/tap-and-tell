/**
 * GET /api/entries
 * Returns only approved guest entries, newest first.
 * Entries without a status are treated as approved (backwards compatibility).
 */
export default defineEventHandler(() => {
  const entries = readApprovedEntries()
  return {
    success: true,
    data: entries
  }
})
