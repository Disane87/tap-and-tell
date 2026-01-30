/**
 * NFC context information extracted from URL query params.
 */
export interface NfcContext {
  /** Whether the user arrived via NFC tap. */
  isNfcEntry: boolean
  /** Optional event name from the NFC tag. */
  eventName: string | null
}

/**
 * Composable for detecting NFC context from URL query parameters.
 *
 * NFC tags can encode URLs like: https://app.com/?source=nfc&event=Wedding
 * This composable extracts that context for personalized messaging.
 *
 * @returns NFC context and welcome message.
 */
export function useNfc() {
  const route = useRoute()

  /**
   * NFC context extracted from query params.
   */
  const nfcContext = computed<NfcContext>(() => {
    const source = route.query.source
    const event = route.query.event

    return {
      isNfcEntry: source === 'nfc',
      eventName: typeof event === 'string' ? event : null
    }
  })

  /**
   * Personalized welcome message based on NFC context.
   */
  const welcomeMessage = computed<string>(() => {
    if (!nfcContext.value.isNfcEntry) {
      return 'Welcome! Leave a message in our guestbook.'
    }

    if (nfcContext.value.eventName) {
      return `Welcome to ${nfcContext.value.eventName}! Leave a message in our guestbook.`
    }

    return 'You tapped in! Leave a message in our guestbook.'
  })

  return {
    nfcContext,
    welcomeMessage
  }
}
