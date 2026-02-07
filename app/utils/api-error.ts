/**
 * API Error Translation Utility
 *
 * Translates known API error messages to localized strings.
 * Unknown errors are returned as-is (for direct API consumers).
 *
 * @example
 * ```ts
 * const { t } = useI18n()
 * const message = translateApiError(error.message, t)
 * toast.error(message)
 * ```
 */

type TranslateFunction = (key: string) => string

/**
 * Map of known API error messages to their i18n keys.
 * Add new error messages here as they are identified.
 */
const errorKeyMap: Record<string, string> = {
  // 2FA errors
  'Two-factor authentication is required. Please set up 2FA in your security settings.': 'apiErrors.twoFactorRequired',

  // Auth errors
  'Not authenticated': 'apiErrors.notAuthenticated',
  'Invalid credentials': 'apiErrors.invalidCredentials',
  'Email already in use': 'apiErrors.emailInUse',
  'Account not found': 'apiErrors.accountNotFound',
  'Invalid password': 'apiErrors.invalidPassword',
  'Session expired': 'apiErrors.sessionExpired',

  // Tenant errors
  'Tenant not found': 'apiErrors.tenantNotFound',
  'You are not a member of this tenant': 'apiErrors.notTenantMember',
  'Only owners can perform this action': 'apiErrors.ownerOnly',

  // Guestbook errors
  'Guestbook not found': 'apiErrors.guestbookNotFound',
  'Entry not found': 'apiErrors.entryNotFound',
  'Rate limit exceeded': 'apiErrors.rateLimitExceeded',

  // Validation errors
  'Invalid email format': 'apiErrors.invalidEmail',
  'Password too weak': 'apiErrors.passwordTooWeak',
  'Name is required': 'apiErrors.nameRequired',

  // Generic errors
  'Server error': 'apiErrors.serverError',
  'Bad request': 'apiErrors.badRequest',
  'Forbidden': 'apiErrors.forbidden',
  'Not found': 'apiErrors.notFound'
}

/**
 * Translates an API error message to the user's locale.
 * If the message is not in the known error map, returns the original message.
 *
 * @param message - The API error message (in English)
 * @param t - The i18n translate function
 * @returns The translated error message
 */
export function translateApiError(message: string, t: TranslateFunction): string {
  const key = errorKeyMap[message]
  if (key) {
    const translated = t(key)
    // If translation returns the key itself, fallback to original message
    if (translated !== key) {
      return translated
    }
  }
  return message
}

/**
 * Extracts and translates an error message from a $fetch error.
 *
 * @param error - The caught error from $fetch
 * @param t - The i18n translate function
 * @param fallback - Fallback message if none can be extracted
 * @returns The translated error message
 */
export function extractApiError(
  error: unknown,
  t: TranslateFunction,
  fallback = t('apiErrors.unknownError')
): string {
  const fetchError = error as {
    data?: { message?: string }
    statusCode?: number
    message?: string
  }

  const message = fetchError.data?.message || fetchError.message || fallback
  return translateApiError(message, t)
}
