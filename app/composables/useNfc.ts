/**
 * Composable for detecting NFC entry context from URL query parameters.
 *
 * NFC tags are programmed with URLs like `/?source=nfc&event=Birthday`.
 * This composable extracts that context and provides a welcome message.
 *
 * @returns NFC context object and a computed welcome message.
 */

interface NfcContext {
  isNfcEntry: boolean
  eventName: string | null
  source: string | null
}

export function useNfc() {
  const route = useRoute()

  /** Reactive NFC context derived from URL query parameters. */
  const nfcContext = computed<NfcContext>(() => {
    const source = (route.query.source as string) || null
    const eventName = (route.query.event as string) || null

    return {
      isNfcEntry: source === 'nfc',
      eventName,
      source
    }
  })

  /** Context-aware welcome message based on NFC entry. */
  const welcomeMessage = computed<string>(() => {
    if (nfcContext.value.eventName) {
      return `Welcome to ${nfcContext.value.eventName}!`
    }
    if (nfcContext.value.isNfcEntry) {
      return 'Welcome! Thanks for tapping.'
    }
    return 'Welcome!'
  })

  return {
    nfcContext,
    welcomeMessage
  }
}
