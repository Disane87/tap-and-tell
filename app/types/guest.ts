/**
 * Favorite song with optional Spotify/YouTube link.
 */
export interface FavoriteSong {
  title: string
  artist?: string
  url?: string
}

/**
 * Favorite video with optional YouTube link.
 */
export interface FavoriteVideo {
  title: string
  url?: string
}

/**
 * All optional "Freundebuch" answers collected in the form wizard.
 */
export interface GuestAnswers {
  // Favorites (Step 2)
  favoriteColor?: string
  favoriteFood?: string
  favoriteMovie?: string
  favoriteSong?: FavoriteSong
  favoriteVideo?: FavoriteVideo

  // Fun Facts (Step 3)
  superpower?: string
  hiddenTalent?: string
  desertIslandItems?: string
  coffeeOrTea?: 'coffee' | 'tea'
  nightOwlOrEarlyBird?: 'night_owl' | 'early_bird'
  beachOrMountains?: 'beach' | 'mountains'

  // Our Story (Step 4)
  howWeMet?: string
  bestMemory?: string

  // Custom Questions (Step 5)
  customAnswers?: Record<string, string>
}

/**
 * Entry moderation status.
 */
export type EntryStatus = 'pending' | 'approved' | 'rejected'

/**
 * A single guestbook entry stored in the database.
 */
export interface GuestEntry {
  id: string
  name: string
  message: string
  photoUrl?: string
  answers?: GuestAnswers
  createdAt: string
  status?: EntryStatus
  rejectionReason?: string
}

/**
 * Input payload for creating a new guest entry.
 */
export interface CreateGuestEntryInput {
  name: string
  message: string
  photo?: string // Base64-encoded image data
  answers?: GuestAnswers
}

/**
 * API response for a single entry.
 */
export interface GuestEntryResponse {
  success: boolean
  data?: GuestEntry
  error?: string
}

/**
 * API response for multiple entries.
 */
export interface GuestEntriesResponse {
  success: boolean
  data?: GuestEntry[]
  error?: string
}
