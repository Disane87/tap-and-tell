/** Favorite song media reference. */
export interface FavoriteSong {
  type: 'spotify' | 'apple_music' | 'youtube' | 'text'
  title: string
  artist?: string
  url?: string
}

/** Favorite video media reference. */
export interface FavoriteVideo {
  type: 'youtube' | 'vimeo' | 'text'
  title: string
  url?: string
  videoId?: string
}

/** All optional Freundebuch (friendship book) answers. */
export interface GuestAnswers {
  // Personal Favorites
  favoriteColor?: string
  favoriteFood?: string
  favoriteMovie?: string
  favoriteSong?: FavoriteSong
  favoriteVideo?: FavoriteVideo

  // Fun Questions
  superpower?: string
  hiddenTalent?: string
  desertIslandItems?: string

  // Quick Toggles
  coffeeOrTea?: 'coffee' | 'tea'
  nightOwlOrEarlyBird?: 'night_owl' | 'early_bird'
  beachOrMountains?: 'beach' | 'mountains'

  // Connection
  bestMemory?: string
  howWeMet?: string
  messageToHost?: string
}

/** A persisted guest book entry. */
export interface GuestEntry {
  id: string
  name: string
  message: string
  photoUrl: string | null
  createdAt: string
  answers?: GuestAnswers
}

/** Payload for creating a new guest entry via `POST /api/entries`. */
export interface CreateGuestEntryInput {
  name: string
  message: string
  photo?: string // Base64 encoded image
  answers?: GuestAnswers
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
