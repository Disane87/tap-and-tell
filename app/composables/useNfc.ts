/** NFC context parsed from URL query parameters. */
export interface NfcContext {
  isNfcEntry: boolean
  eventName: string | null
  source: string | null
}

/**
 * Composable for detecting NFC entry context from URL query parameters.
 *
 * NFC tags are programmed to open URLs like `/?source=nfc&event=Birthday`.
 * This composable reads those params and provides reactive NFC state
 * and a context-aware welcome message.
 *
 * @returns Reactive NFC context and a computed welcome message.
 */
export function useNfc() {
  const route = useRoute()

  const nfcContext = computed<NfcContext>(() => {
    const source = route.query.source as string | undefined
    const event = route.query.event as string | undefined

    return {
      isNfcEntry: source === 'nfc',
      eventName: event || null,
      source: source || null
    }
  })

  const welcomeMessage = computed(() => {
    if (nfcContext.value.eventName) {
      return `Welcome to ${nfcContext.value.eventName}!`
    }
    if (nfcContext.value.isNfcEntry) {
      return 'Welcome! Thanks for tapping.'
    }
    return 'Welcome!'
  })

  return {
    nfcContext: readonly(nfcContext),
    welcomeMessage
  }
}
