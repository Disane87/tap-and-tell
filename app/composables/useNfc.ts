export interface NfcContext {
  isNfcEntry: boolean
  eventName: string | null
  source: string | null
}

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
