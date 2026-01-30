/**
 * TypeScript type definitions for guest entries and API contracts.
 * @module types/guest
 */

/** A media reference for a guest's favorite song. */
export interface FavoriteSong {
  type: 'song'
  title: string
  artist?: string
  url?: string
}

/** A media reference for a guest's favorite video. */
export interface FavoriteVideo {
  type: 'video'
  title: string
  url?: string
  videoId?: string
}

/**
 * Extended Freundebuch-style answers a guest may provide.
 * All fields are optional.
 */
export interface GuestAnswers {
  /** Favorites */
  favoriteColor?: string
  favoriteFood?: string
  favoriteMovie?: string
  favoriteSong?: FavoriteSong
  favoriteVideo?: FavoriteVideo

  /** Fun questions */
  superpower?: string
  hiddenTalent?: string
  desertIslandItems?: string

  /** Binary toggle choices */
  coffeeOrTea?: 'coffee' | 'tea'
  nightOwlOrEarlyBird?: 'night_owl' | 'early_bird'
  beachOrMountains?: 'beach' | 'mountains'

  /** Connection */
  bestMemory?: string
  howWeMet?: string
  messageToHost?: string
}

/** A persisted guest entry with all metadata. */
export interface GuestEntry {
  id: string
  name: string
  message: string
  photoUrl: string | null
  createdAt: string
  answers?: GuestAnswers
}

/** The payload sent to `POST /api/entries` when creating a new entry. */
export interface CreateGuestEntryInput {
  name: string
  message: string
  photo?: string | null
  answers?: GuestAnswers
}

/** API response for a single guest entry. */
export interface GuestEntryResponse {
  success: boolean
  data?: GuestEntry
  error?: string
}

/** API response for a list of guest entries. */
export interface GuestEntriesResponse {
  success: boolean
  data?: GuestEntry[]
  error?: string
}
