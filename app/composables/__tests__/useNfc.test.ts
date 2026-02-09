/**
 * Unit tests for useNfc composable.
 *
 * Tests NFC context detection from URL query parameters
 * and personalized welcome message generation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'

// Mock Vue auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Mock useRoute — will be overridden per test
let mockRouteQuery: Record<string, string | string[] | undefined> = {}
vi.stubGlobal('useRoute', () => ({ query: mockRouteQuery }))

// Import after mocks
import { useNfc } from '../useNfc'

describe('useNfc', () => {
  beforeEach(() => {
    mockRouteQuery = {}
  })

  describe('nfcContext', () => {
    it('should detect non-NFC entry when no query params', () => {
      mockRouteQuery = {}
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(false)
      expect(nfcContext.value.eventName).toBeNull()
    })

    it('should detect NFC entry when source=nfc', () => {
      mockRouteQuery = { source: 'nfc' }
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(true)
      expect(nfcContext.value.eventName).toBeNull()
    })

    it('should detect NFC entry with event name', () => {
      mockRouteQuery = { source: 'nfc', event: 'Wedding' }
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(true)
      expect(nfcContext.value.eventName).toBe('Wedding')
    })

    it('should not detect NFC entry when source is not "nfc"', () => {
      mockRouteQuery = { source: 'qr' }
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(false)
    })

    it('should return null eventName when event is not a string (array)', () => {
      // useRoute can return arrays for repeated query params
      mockRouteQuery = { source: 'nfc', event: ['Wedding', 'Birthday'] as unknown as string }
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(true)
      // typeof ['Wedding', 'Birthday'] !== 'string', so should be null
      expect(nfcContext.value.eventName).toBeNull()
    })

    it('should handle empty event string', () => {
      mockRouteQuery = { source: 'nfc', event: '' }
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(true)
      // Empty string is still typeof string
      expect(nfcContext.value.eventName).toBe('')
    })

    it('should handle event param without source param', () => {
      mockRouteQuery = { event: 'Wedding' }
      const { nfcContext } = useNfc()

      expect(nfcContext.value.isNfcEntry).toBe(false)
      expect(nfcContext.value.eventName).toBe('Wedding')
    })
  })

  describe('welcomeMessage', () => {
    it('should return generic message when not NFC entry', () => {
      mockRouteQuery = {}
      const { welcomeMessage } = useNfc()

      expect(welcomeMessage.value).toBe('Welcome! Leave a message in our guestbook.')
    })

    it('should return NFC tap message when NFC without event', () => {
      mockRouteQuery = { source: 'nfc' }
      const { welcomeMessage } = useNfc()

      expect(welcomeMessage.value).toBe('You tapped in! Leave a message in our guestbook.')
    })

    it('should return personalized message when NFC with event name', () => {
      mockRouteQuery = { source: 'nfc', event: 'Wedding' }
      const { welcomeMessage } = useNfc()

      expect(welcomeMessage.value).toBe('Welcome to Wedding! Leave a message in our guestbook.')
    })

    it('should return NFC tap message when NFC with empty event', () => {
      mockRouteQuery = { source: 'nfc', event: '' }
      const { welcomeMessage } = useNfc()

      // Empty string is falsy, so it should fall through to the NFC-no-event message
      expect(welcomeMessage.value).toBe('You tapped in! Leave a message in our guestbook.')
    })

    it('should include event name in message for special characters', () => {
      mockRouteQuery = { source: 'nfc', event: "Sarah & Tom's Wedding" }
      const { welcomeMessage } = useNfc()

      expect(welcomeMessage.value).toBe("Welcome to Sarah & Tom's Wedding! Leave a message in our guestbook.")
    })

    it('should return generic message when source is not nfc even with event', () => {
      mockRouteQuery = { source: 'qr', event: 'Party' }
      const { welcomeMessage } = useNfc()

      expect(welcomeMessage.value).toBe('Welcome! Leave a message in our guestbook.')
    })
  })

  describe('return value structure', () => {
    it('should return nfcContext and welcomeMessage', () => {
      const result = useNfc()

      expect(result).toHaveProperty('nfcContext')
      expect(result).toHaveProperty('welcomeMessage')
    })

    it('should return computed refs', () => {
      const { nfcContext, welcomeMessage } = useNfc()

      // Computed refs have a .value property and an .effect property
      expect(nfcContext).toHaveProperty('value')
      expect(welcomeMessage).toHaveProperty('value')
    })
  })
})
