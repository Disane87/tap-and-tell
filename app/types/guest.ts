export interface GuestEntry {
  id: string
  name: string
  message: string
  photoUrl: string | null
  createdAt: string
}

export interface CreateGuestEntryInput {
  name: string
  message: string
  photo?: string // Base64 encoded image
}

export interface GuestEntryResponse {
  success: boolean
  data?: GuestEntry
  error?: string
}

export interface GuestEntriesResponse {
  success: boolean
  data?: GuestEntry[]
  error?: string
}
