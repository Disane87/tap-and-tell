/**
 * GET /api/health
 * Health check endpoint for Docker and monitoring.
 * Returns server status and timestamp.
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})
