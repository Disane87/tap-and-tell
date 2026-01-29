/** A persisted guest book entry. */
export interface GuestEntry {
  id: string
  name: string
  message: string
  photoUrl: string | null
  createdAt: string
}

/** Payload for creating a new guest entry via `POST /api/entries`. */
export interface CreateGuestEntryInput {
  name: string
  message: string
  photo?: string // Base64 encoded image
}

/** API response wrapper for a single guest entry. */
export interface GuestEntryResponse {
  success: boolean
  data?: GuestEntry
  error?: string
}

/** API response wrapper for a list of guest entries. */
export interface GuestEntriesResponse {
  success: boolean
  data?: GuestEntry[]
  error?: string
}
