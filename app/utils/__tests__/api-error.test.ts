import { describe, it, expect } from 'vitest'
import { translateApiError, extractApiError } from '../api-error'

/**
 * Creates a mock translate function that returns localized strings
 * for known i18n keys, or the key itself for unknown keys.
 */
function createMockT(overrides: Record<string, string> = {}): (key: string) => string {
  const translations: Record<string, string> = {
    // 2FA errors
    'apiErrors.twoFactorRequired': '2FA ist erforderlich.',
    // Auth errors
    'apiErrors.notAuthenticated': 'Nicht authentifiziert',
    'apiErrors.invalidCredentials': 'Ungueltige Anmeldedaten',
    'apiErrors.emailInUse': 'E-Mail bereits vergeben',
    'apiErrors.accountNotFound': 'Konto nicht gefunden',
    'apiErrors.invalidPassword': 'Ungueltiges Passwort',
    'apiErrors.sessionExpired': 'Sitzung abgelaufen',
    // Tenant errors
    'apiErrors.tenantNotFound': 'Mandant nicht gefunden',
    'apiErrors.notTenantMember': 'Kein Mitglied dieses Mandanten',
    'apiErrors.ownerOnly': 'Nur Eigentuemer koennen dies tun',
    // Guestbook errors
    'apiErrors.guestbookNotFound': 'Gaestebuch nicht gefunden',
    'apiErrors.entryNotFound': 'Eintrag nicht gefunden',
    'apiErrors.rateLimitExceeded': 'Anfragelimit ueberschritten',
    // Validation errors
    'apiErrors.invalidEmail': 'Ungueltiges E-Mail-Format',
    'apiErrors.passwordTooWeak': 'Passwort zu schwach',
    'apiErrors.nameRequired': 'Name ist erforderlich',
    // Generic errors
    'apiErrors.serverError': 'Serverfehler',
    'apiErrors.badRequest': 'Fehlerhafte Anfrage',
    'apiErrors.forbidden': 'Zugriff verweigert',
    'apiErrors.notFound': 'Nicht gefunden',
    // Fallback
    'apiErrors.unknownError': 'Unbekannter Fehler',
    ...overrides,
  }

  return (key: string) => translations[key] ?? key
}

describe('translateApiError', () => {
  const t = createMockT()

  describe('known error mappings', () => {
    const knownErrors: Array<{ message: string; expectedKey: string; expectedTranslation: string }> = [
      {
        message: 'Two-factor authentication is required. Please set up 2FA in your security settings.',
        expectedKey: 'apiErrors.twoFactorRequired',
        expectedTranslation: '2FA ist erforderlich.',
      },
      {
        message: 'Not authenticated',
        expectedKey: 'apiErrors.notAuthenticated',
        expectedTranslation: 'Nicht authentifiziert',
      },
      {
        message: 'Invalid credentials',
        expectedKey: 'apiErrors.invalidCredentials',
        expectedTranslation: 'Ungueltige Anmeldedaten',
      },
      {
        message: 'Email already in use',
        expectedKey: 'apiErrors.emailInUse',
        expectedTranslation: 'E-Mail bereits vergeben',
      },
      {
        message: 'Account not found',
        expectedKey: 'apiErrors.accountNotFound',
        expectedTranslation: 'Konto nicht gefunden',
      },
      {
        message: 'Invalid password',
        expectedKey: 'apiErrors.invalidPassword',
        expectedTranslation: 'Ungueltiges Passwort',
      },
      {
        message: 'Session expired',
        expectedKey: 'apiErrors.sessionExpired',
        expectedTranslation: 'Sitzung abgelaufen',
      },
      {
        message: 'Tenant not found',
        expectedKey: 'apiErrors.tenantNotFound',
        expectedTranslation: 'Mandant nicht gefunden',
      },
      {
        message: 'You are not a member of this tenant',
        expectedKey: 'apiErrors.notTenantMember',
        expectedTranslation: 'Kein Mitglied dieses Mandanten',
      },
      {
        message: 'Only owners can perform this action',
        expectedKey: 'apiErrors.ownerOnly',
        expectedTranslation: 'Nur Eigentuemer koennen dies tun',
      },
      {
        message: 'Guestbook not found',
        expectedKey: 'apiErrors.guestbookNotFound',
        expectedTranslation: 'Gaestebuch nicht gefunden',
      },
      {
        message: 'Entry not found',
        expectedKey: 'apiErrors.entryNotFound',
        expectedTranslation: 'Eintrag nicht gefunden',
      },
      {
        message: 'Rate limit exceeded',
        expectedKey: 'apiErrors.rateLimitExceeded',
        expectedTranslation: 'Anfragelimit ueberschritten',
      },
      {
        message: 'Invalid email format',
        expectedKey: 'apiErrors.invalidEmail',
        expectedTranslation: 'Ungueltiges E-Mail-Format',
      },
      {
        message: 'Password too weak',
        expectedKey: 'apiErrors.passwordTooWeak',
        expectedTranslation: 'Passwort zu schwach',
      },
      {
        message: 'Name is required',
        expectedKey: 'apiErrors.nameRequired',
        expectedTranslation: 'Name ist erforderlich',
      },
      {
        message: 'Server error',
        expectedKey: 'apiErrors.serverError',
        expectedTranslation: 'Serverfehler',
      },
      {
        message: 'Bad request',
        expectedKey: 'apiErrors.badRequest',
        expectedTranslation: 'Fehlerhafte Anfrage',
      },
      {
        message: 'Forbidden',
        expectedKey: 'apiErrors.forbidden',
        expectedTranslation: 'Zugriff verweigert',
      },
      {
        message: 'Not found',
        expectedKey: 'apiErrors.notFound',
        expectedTranslation: 'Nicht gefunden',
      },
    ]

    it.each(knownErrors)(
      'translates "$message" to the localized string',
      ({ message, expectedTranslation }) => {
        expect(translateApiError(message, t)).toBe(expectedTranslation)
      },
    )
  })

  describe('unknown errors', () => {
    it('returns the original message for an unknown error', () => {
      const unknownMessage = 'Something completely unexpected happened'
      expect(translateApiError(unknownMessage, t)).toBe(unknownMessage)
    })

    it('returns the original message for an empty string', () => {
      expect(translateApiError('', t)).toBe('')
    })

    it('returns the original message for a partial match', () => {
      // "Not authenticated" is known, but "Not authenticated!!!" is not
      expect(translateApiError('Not authenticated!!!', t)).toBe('Not authenticated!!!')
    })

    it('is case-sensitive and does not match different casing', () => {
      expect(translateApiError('not authenticated', t)).toBe('not authenticated')
      expect(translateApiError('NOT AUTHENTICATED', t)).toBe('NOT AUTHENTICATED')
      expect(translateApiError('invalid credentials', t)).toBe('invalid credentials')
    })
  })

  describe('translation returns key itself (missing translation)', () => {
    it('falls back to the original API message when the translate function returns the key', () => {
      // Create a t function that returns the key for the known mapping
      const tReturnsKey = (key: string) => key
      expect(translateApiError('Not authenticated', tReturnsKey)).toBe('Not authenticated')
    })

    it('falls back to the original message when only some translations are missing', () => {
      // This t function only knows one translation
      const tPartial = createMockT({
        'apiErrors.notAuthenticated': 'apiErrors.notAuthenticated', // returns key itself
      })
      expect(translateApiError('Not authenticated', tPartial)).toBe('Not authenticated')
      // But other translations still work
      expect(translateApiError('Invalid credentials', tPartial)).toBe('Ungueltige Anmeldedaten')
    })
  })
})

describe('extractApiError', () => {
  const t = createMockT()

  describe('error with data.message', () => {
    it('extracts and translates message from error.data.message', () => {
      const error = {
        data: { message: 'Not authenticated' },
        statusCode: 401,
      }
      expect(extractApiError(error, t)).toBe('Nicht authentifiziert')
    })

    it('extracts and translates a known message from data.message', () => {
      const error = {
        data: { message: 'Rate limit exceeded' },
        statusCode: 429,
      }
      expect(extractApiError(error, t)).toBe('Anfragelimit ueberschritten')
    })

    it('returns original message from data.message for unknown errors', () => {
      const error = {
        data: { message: 'Some custom backend error' },
        statusCode: 500,
      }
      expect(extractApiError(error, t)).toBe('Some custom backend error')
    })

    it('prefers data.message over top-level message', () => {
      const error = {
        data: { message: 'Invalid credentials' },
        message: 'Fetch failed',
        statusCode: 401,
      }
      expect(extractApiError(error, t)).toBe('Ungueltige Anmeldedaten')
    })
  })

  describe('error with only top-level message', () => {
    it('extracts and translates from error.message when data.message is absent', () => {
      const error = {
        message: 'Session expired',
        statusCode: 401,
      }
      expect(extractApiError(error, t)).toBe('Sitzung abgelaufen')
    })

    it('extracts and translates from error.message when data is undefined', () => {
      const error = {
        message: 'Forbidden',
      }
      expect(extractApiError(error, t)).toBe('Zugriff verweigert')
    })

    it('returns original message from error.message for unknown errors', () => {
      const error = {
        message: 'Network connection lost',
      }
      expect(extractApiError(error, t)).toBe('Network connection lost')
    })

    it('uses error.message when data exists but has no message property', () => {
      const error = {
        data: { statusCode: 500 },
        message: 'Server error',
      }
      expect(extractApiError(error, t)).toBe('Serverfehler')
    })
  })

  describe('error with neither data.message nor message (uses fallback)', () => {
    it('uses the default fallback from t("apiErrors.unknownError")', () => {
      const error = {}
      expect(extractApiError(error, t)).toBe('Unbekannter Fehler')
    })

    it('uses the default fallback when error is an empty object with data but no messages', () => {
      const error = { data: {} }
      expect(extractApiError(error, t)).toBe('Unbekannter Fehler')
    })

    it('uses a custom fallback when provided', () => {
      const error = {}
      expect(extractApiError(error, t, 'Custom fallback message')).toBe('Custom fallback message')
    })

    it('translates the custom fallback if it matches a known error', () => {
      const error = {}
      expect(extractApiError(error, t, 'Bad request')).toBe('Fehlerhafte Anfrage')
    })
  })

  describe('null and undefined error fields', () => {
    it('returns fallback for null error', () => {
      expect(extractApiError(null, t)).toBe('Unbekannter Fehler')
    })

    it('returns fallback for undefined error', () => {
      expect(extractApiError(undefined, t)).toBe('Unbekannter Fehler')
    })

    it('handles error with data.message set to undefined', () => {
      const error = { data: { message: undefined } }
      expect(extractApiError(error, t)).toBe('Unbekannter Fehler')
    })

    it('handles error with data.message set to empty string', () => {
      const error = { data: { message: '' } }
      // Empty string is falsy, so it should fall through to fallback
      expect(extractApiError(error, t)).toBe('Unbekannter Fehler')
    })

    it('handles error with top-level message set to empty string', () => {
      const error = { message: '' }
      expect(extractApiError(error, t)).toBe('Unbekannter Fehler')
    })

    it('handles error with null data', () => {
      const error = { data: null }
      expect(extractApiError(error, t)).toBe('Unbekannter Fehler')
    })

    it('handles a plain string as error', () => {
      // Strings have a .message of undefined via casting
      expect(extractApiError('some string error', t)).toBe('Unbekannter Fehler')
    })

    it('handles a number as error', () => {
      expect(extractApiError(42, t)).toBe('Unbekannter Fehler')
    })
  })
})
