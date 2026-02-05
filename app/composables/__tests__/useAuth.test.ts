/**
 * Unit tests for useAuth composable.
 *
 * Tests authentication flows including login, register, logout,
 * 2FA verification, and profile management.
 *
 * Note: Since useAuth uses module-level state, we use vi.resetModules()
 * to get a fresh state for each test suite.
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest'
import { ref, computed, readonly } from 'vue'

// Mock Vue auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('readonly', readonly)

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useAuth', () => {
  // Fresh import for each test suite
  let useAuth: () => ReturnType<typeof import('../useAuth')['useAuth']>

  beforeAll(async () => {
    // Import the module
    const module = await import('../useAuth')
    useAuth = module.useAuth
  })

  beforeEach(() => {
    // Clear mocks between tests
    vi.clearAllMocks()
  })

  describe('initial state (fresh import)', () => {
    it('has expected structure', () => {
      const auth = useAuth()
      expect(auth).toHaveProperty('user')
      expect(auth).toHaveProperty('loading')
      expect(auth).toHaveProperty('isAuthenticated')
      expect(auth).toHaveProperty('initialized')
      expect(auth).toHaveProperty('twoFactorToken')
      expect(auth).toHaveProperty('twoFactorMethod')
      expect(auth).toHaveProperty('fetchMe')
      expect(auth).toHaveProperty('refreshUser')
      expect(auth).toHaveProperty('register')
      expect(auth).toHaveProperty('login')
      expect(auth).toHaveProperty('verify2fa')
      expect(auth).toHaveProperty('resend2faCode')
      expect(auth).toHaveProperty('clear2fa')
      expect(auth).toHaveProperty('logout')
      expect(auth).toHaveProperty('updateProfile')
      expect(auth).toHaveProperty('changePassword')
      expect(auth).toHaveProperty('deleteAccount')
      expect(auth).toHaveProperty('uploadAvatar')
      expect(auth).toHaveProperty('deleteAvatar')
    })
  })

  describe('login', () => {
    it('calls login endpoint with correct credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })

      const { login } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        body: { email: 'test@example.com', password: 'password123' }
      })
    })

    it('returns success when login succeeds', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })

      const { login } = useAuth()
      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(result).toBe('success')
    })

    it('returns 2fa when 2FA is required', async () => {
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-123',
        twoFactorMethod: 'totp'
      })

      const { login } = useAuth()
      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(result).toBe('2fa')
    })

    it('sets 2FA state when required', async () => {
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-123',
        twoFactorMethod: 'totp'
      })

      const { login, twoFactorToken, twoFactorMethod } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(twoFactorToken.value).toBe('temp-token-123')
      expect(twoFactorMethod.value).toBe('totp')
    })

    it('returns error on failure', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { login } = useAuth()
      const result = await login({ email: 'test@example.com', password: 'wrong' })

      expect(result).toBe('error')
    })

    it('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { login } = useAuth()
      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(result).toBe('error')
    })
  })

  describe('register', () => {
    it('calls register endpoint with correct data', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'new@example.com', name: 'New' } })

      const { register } = useAuth()
      await register({
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        body: { email: 'new@example.com', password: 'SecurePass123!', name: 'New User' }
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'new@example.com', name: 'New' } })

      const { register } = useAuth()
      const result = await register({
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      })

      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { register } = useAuth()
      const result = await register({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test'
      })

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { register } = useAuth()
      const result = await register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test'
      })

      expect(result).toBe(false)
    })
  })

  describe('verify2fa', () => {
    it('returns false when no token is set', async () => {
      const { clear2fa, verify2fa } = useAuth()
      clear2fa()

      const result = await verify2fa('123456')
      expect(result).toBe(false)
      expect(mockFetch).not.toHaveBeenCalledWith('/api/auth/2fa/verify', expect.anything())
    })

    it('calls verify endpoint with token and code', async () => {
      // Set up 2FA state first
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-abc',
        twoFactorMethod: 'totp'
      })
      const { login, verify2fa } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Then verify
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'test@example.com', name: 'Test' } })
      await verify2fa('654321')

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/2fa/verify', {
        method: 'POST',
        body: { token: 'temp-token-abc', code: '654321' }
      })
    })

    it('returns true and sets user when verification succeeds', async () => {
      // Set up 2FA state first
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-abc',
        twoFactorMethod: 'totp'
      })
      const { login, verify2fa, user, twoFactorToken, twoFactorMethod } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Then verify
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      const result = await verify2fa('654321')

      expect(result).toBe(true)
      expect(user.value).toEqual(mockUser)
      expect(twoFactorToken.value).toBeNull()
      expect(twoFactorMethod.value).toBeNull()
    })

    it('returns false when API returns success: false', async () => {
      // Set up 2FA state first
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-abc',
        twoFactorMethod: 'totp'
      })
      const { login, verify2fa } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Verify fails
      mockFetch.mockResolvedValueOnce({ success: false })
      const result = await verify2fa('654321')

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      // Set up 2FA state first
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-abc',
        twoFactorMethod: 'totp'
      })
      const { login, verify2fa } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const result = await verify2fa('654321')

      expect(result).toBe(false)
    })
  })

  describe('clear2fa', () => {
    it('clears 2FA state', async () => {
      // Set up 2FA state
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-xyz',
        twoFactorMethod: 'email'
      })
      const { login, clear2fa, twoFactorToken, twoFactorMethod } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(twoFactorToken.value).toBe('temp-token-xyz')

      clear2fa()

      expect(twoFactorToken.value).toBeNull()
      expect(twoFactorMethod.value).toBeNull()
    })
  })

  describe('logout', () => {
    it('calls logout endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const { logout } = useAuth()
      await logout()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    })

    it('clears user on logout even when API fails', async () => {
      // First set user
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'test@example.com', name: 'Test' } })
      const { login, logout, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Logout fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      await logout()

      expect(user.value).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('calls update endpoint with correct data', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'test@example.com', name: 'Updated' } })

      const { updateProfile } = useAuth()
      await updateProfile({ name: 'Updated Name' })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'PUT',
        body: { name: 'Updated Name' }
      })
    })
  })

  describe('changePassword', () => {
    it('calls password endpoint with correct data', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const { changePassword } = useAuth()
      await changePassword({
        currentPassword: 'oldPass123!',
        newPassword: 'newPass456!'
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/password', {
        method: 'PUT',
        body: { currentPassword: 'oldPass123!', newPassword: 'newPass456!' }
      })
    })

    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const { changePassword } = useAuth()
      const result = await changePassword({
        currentPassword: 'oldPass123!',
        newPassword: 'newPass456!'
      })

      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Invalid password'))

      const { changePassword } = useAuth()
      const result = await changePassword({
        currentPassword: 'wrong',
        newPassword: 'newPass456!'
      })

      expect(result).toBe(false)
    })
  })

  describe('deleteAccount', () => {
    it('calls delete endpoint with password', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const { deleteAccount } = useAuth()
      await deleteAccount('confirmPassword123')

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
        method: 'DELETE',
        body: { password: 'confirmPassword123' }
      })
    })
  })

  describe('uploadAvatar', () => {
    it('sends file as FormData', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: { avatarUrl: '/api/auth/avatar/123' } })

      const { uploadAvatar } = useAuth()
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      await uploadAvatar(file)

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/avatar', {
        method: 'POST',
        body: expect.any(FormData)
      })
    })

    it('returns true and updates user avatarUrl on success when user is logged in', async () => {
      // First login to set user
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      const { login, uploadAvatar, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Upload avatar
      mockFetch.mockResolvedValueOnce({ success: true, data: { avatarUrl: '/api/auth/avatar/123' } })
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await uploadAvatar(file)

      expect(result).toBe(true)
      expect(user.value?.avatarUrl).toBe('/api/auth/avatar/123')
    })

    it('returns false when API returns success but no data', async () => {
      // First login to set user
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: null }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      const { login, uploadAvatar } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Upload avatar with no data in response
      mockFetch.mockResolvedValueOnce({ success: true })
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await uploadAvatar(file)

      expect(result).toBe(false)
    })

    it('returns false when user is not logged in', async () => {
      // Logout first to ensure no user
      mockFetch.mockResolvedValueOnce({ success: true })
      const { logout, uploadAvatar } = useAuth()
      await logout()

      // Try to upload avatar
      mockFetch.mockResolvedValueOnce({ success: true, data: { avatarUrl: '/api/auth/avatar/123' } })
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await uploadAvatar(file)

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { uploadAvatar } = useAuth()
      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
      const result = await uploadAvatar(file)

      expect(result).toBe(false)
    })
  })

  describe('deleteAvatar', () => {
    it('calls delete avatar endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ success: true })

      const { deleteAvatar } = useAuth()
      await deleteAvatar()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/avatar', {
        method: 'DELETE'
      })
    })

    it('returns true and clears avatarUrl when user is logged in and API succeeds', async () => {
      // First login to set user with avatar
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: '/api/auth/avatar/123' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      const { login, deleteAvatar, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(user.value?.avatarUrl).toBe('/api/auth/avatar/123')

      // Delete avatar
      mockFetch.mockResolvedValueOnce({ success: true })
      const result = await deleteAvatar()

      expect(result).toBe(true)
      expect(user.value?.avatarUrl).toBeNull()
    })

    it('returns false when API succeeds but user is not logged in', async () => {
      // Logout first
      mockFetch.mockResolvedValueOnce({ success: true })
      const { logout, deleteAvatar } = useAuth()
      await logout()

      // Try to delete avatar
      mockFetch.mockResolvedValueOnce({ success: true })
      const result = await deleteAvatar()

      expect(result).toBe(false)
    })

    it('returns false when API returns success: false', async () => {
      // First login to set user
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test', avatarUrl: '/api/auth/avatar/123' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      const { login, deleteAvatar } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Delete avatar fails
      mockFetch.mockResolvedValueOnce({ success: false })
      const result = await deleteAvatar()

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { deleteAvatar } = useAuth()
      const result = await deleteAvatar()

      expect(result).toBe(false)
    })
  })

  describe('fetchMe', () => {
    it('calls me endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'test@example.com', name: 'Test' } })

      const { fetchMe } = useAuth()
      await fetchMe()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me')
    })
  })

  describe('refreshUser', () => {
    it('calls me endpoint', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: { id: '1', email: 'test@example.com', name: 'Test' } })

      const { refreshUser } = useAuth()
      await refreshUser()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me')
    })

    it('updates user on success', async () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Updated' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })

      const { refreshUser, user } = useAuth()
      await refreshUser()

      expect(user.value).toEqual(mockUser)
    })

    it('does not update user when API returns success without data', async () => {
      // First set a user
      const initialUser = { id: '1', email: 'test@example.com', name: 'Initial' }
      mockFetch.mockResolvedValueOnce({ success: true, data: initialUser })
      const { login, refreshUser, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(user.value).toEqual(initialUser)

      // Refresh returns success but no data
      mockFetch.mockResolvedValueOnce({ success: true })
      await refreshUser()

      // User should remain unchanged
      expect(user.value).toEqual(initialUser)
    })

    it('does not update user when API returns success: false', async () => {
      // First set a user
      const initialUser = { id: '1', email: 'test@example.com', name: 'Initial' }
      mockFetch.mockResolvedValueOnce({ success: true, data: initialUser })
      const { login, refreshUser, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(user.value).toEqual(initialUser)

      // Refresh returns success: false
      mockFetch.mockResolvedValueOnce({ success: false })
      await refreshUser()

      // User should remain unchanged
      expect(user.value).toEqual(initialUser)
    })

    it('keeps existing user value on network error', async () => {
      // First set a user
      const initialUser = { id: '1', email: 'test@example.com', name: 'Initial' }
      mockFetch.mockResolvedValueOnce({ success: true, data: initialUser })
      const { login, refreshUser, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(user.value).toEqual(initialUser)

      // Refresh fails with network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      await refreshUser()

      // User should remain unchanged
      expect(user.value).toEqual(initialUser)
    })

    it('can refresh multiple times (unlike fetchMe)', async () => {
      const mockUser1 = { id: '1', email: 'test@example.com', name: 'First' }
      const mockUser2 = { id: '1', email: 'test@example.com', name: 'Second' }

      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser1 })
      const { refreshUser, user } = useAuth()
      await refreshUser()

      expect(user.value).toEqual(mockUser1)

      // Refresh again - should fetch again
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser2 })
      await refreshUser()

      expect(user.value).toEqual(mockUser2)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('resend2faCode', () => {
    it('returns false when no token is set', async () => {
      const { clear2fa, resend2faCode } = useAuth()
      clear2fa()

      const result = await resend2faCode()
      expect(result).toBe(false)
    })

    it('calls resend endpoint and returns true on success', async () => {
      // Set up 2FA state first
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-abc',
        twoFactorMethod: 'email'
      })
      const { login, resend2faCode } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Resend succeeds
      mockFetch.mockResolvedValueOnce({ success: true })
      const result = await resend2faCode()

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/2fa/resend', {
        method: 'POST',
        body: { token: 'temp-token-abc' }
      })
    })

    it('returns false on network error', async () => {
      // Set up 2FA state first
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-abc',
        twoFactorMethod: 'email'
      })
      const { login, resend2faCode } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      // Network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const result = await resend2faCode()

      expect(result).toBe(false)
    })
  })

  describe('login - 2FA method defaults', () => {
    it('defaults twoFactorMethod to totp when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        requires2fa: true,
        twoFactorToken: 'temp-token-123'
        // Note: twoFactorMethod is intentionally not provided
      })

      const { login, twoFactorMethod } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(twoFactorMethod.value).toBe('totp')
    })
  })

  describe('updateProfile - additional cases', () => {
    it('returns false when API returns success: false', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { updateProfile } = useAuth()
      const result = await updateProfile({ name: 'New Name' })

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { updateProfile } = useAuth()
      const result = await updateProfile({ name: 'New Name' })

      expect(result).toBe(false)
    })

    it('updates user state on success', async () => {
      const updatedUser = { id: '1', email: 'test@example.com', name: 'Updated Name' }
      mockFetch.mockResolvedValueOnce({ success: true, data: updatedUser })

      const { updateProfile, user } = useAuth()
      const result = await updateProfile({ name: 'Updated Name' })

      expect(result).toBe(true)
      expect(user.value).toEqual(updatedUser)
    })
  })

  describe('deleteAccount - additional cases', () => {
    it('returns true and clears user on success', async () => {
      // First login to set user
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      const { login, deleteAccount, user } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(user.value).toEqual(mockUser)

      // Delete account
      mockFetch.mockResolvedValueOnce({ success: true })
      const result = await deleteAccount('confirmPassword')

      expect(result).toBe(true)
      expect(user.value).toBeNull()
    })

    it('returns false when API returns success: false', async () => {
      mockFetch.mockResolvedValueOnce({ success: false })

      const { deleteAccount } = useAuth()
      const result = await deleteAccount('wrongPassword')

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { deleteAccount } = useAuth()
      const result = await deleteAccount('password')

      expect(result).toBe(false)
    })
  })

  describe('fetchMe - additional cases', () => {
    it('sets user to null on error', async () => {
      // Need a fresh module to reset initialized state
      vi.resetModules()

      // Re-setup mocks
      vi.stubGlobal('ref', ref)
      vi.stubGlobal('computed', computed)
      vi.stubGlobal('readonly', readonly)
      vi.stubGlobal('$fetch', mockFetch)

      const freshModule = await import('../useAuth')
      const freshAuth = freshModule.useAuth()

      mockFetch.mockRejectedValueOnce(new Error('Unauthorized'))
      await freshAuth.fetchMe()

      expect(freshAuth.user.value).toBeNull()
      expect(freshAuth.initialized.value).toBe(true)
    })

    it('does not fetch again after initialized', async () => {
      // Need a fresh module to reset initialized state
      vi.resetModules()

      // Re-setup mocks
      vi.stubGlobal('ref', ref)
      vi.stubGlobal('computed', computed)
      vi.stubGlobal('readonly', readonly)
      vi.stubGlobal('$fetch', mockFetch)

      const freshModule = await import('../useAuth')
      const freshAuth = freshModule.useAuth()

      const mockUser = { id: '1', email: 'test@example.com', name: 'Test' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })
      await freshAuth.fetchMe()

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Try to fetch again
      await freshAuth.fetchMe()

      // Should not have called again
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('does not set user when API returns success without data', async () => {
      // Need a fresh module to reset initialized state
      vi.resetModules()

      // Re-setup mocks
      vi.stubGlobal('ref', ref)
      vi.stubGlobal('computed', computed)
      vi.stubGlobal('readonly', readonly)
      vi.stubGlobal('$fetch', mockFetch)

      const freshModule = await import('../useAuth')
      const freshAuth = freshModule.useAuth()

      // API returns success but no data
      mockFetch.mockResolvedValueOnce({ success: true })
      await freshAuth.fetchMe()

      expect(freshAuth.user.value).toBeNull()
      expect(freshAuth.initialized.value).toBe(true)
    })

    it('does not set user when API returns success: false', async () => {
      // Need a fresh module to reset initialized state
      vi.resetModules()

      // Re-setup mocks
      vi.stubGlobal('ref', ref)
      vi.stubGlobal('computed', computed)
      vi.stubGlobal('readonly', readonly)
      vi.stubGlobal('$fetch', mockFetch)

      const freshModule = await import('../useAuth')
      const freshAuth = freshModule.useAuth()

      // API returns success: false
      mockFetch.mockResolvedValueOnce({ success: false })
      await freshAuth.fetchMe()

      expect(freshAuth.user.value).toBeNull()
      expect(freshAuth.initialized.value).toBe(true)
    })
  })

  describe('register - sets user on success', () => {
    it('sets user state when registration succeeds', async () => {
      const mockUser = { id: '1', email: 'new@example.com', name: 'New User' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })

      const { register, user } = useAuth()
      await register({
        email: 'new@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      })

      expect(user.value).toEqual(mockUser)
    })
  })

  describe('login - sets user on success', () => {
    it('sets user state when login succeeds', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test' }
      mockFetch.mockResolvedValueOnce({ success: true, data: mockUser })

      const { login, user, isAuthenticated } = useAuth()
      await login({ email: 'test@example.com', password: 'password123' })

      expect(user.value).toEqual(mockUser)
      expect(isAuthenticated.value).toBe(true)
    })
  })
})
