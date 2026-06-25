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
 * A single media item (image or video) attached to a guest entry.
 * Stored in upload order inside the entry's `media` array.
 */
export interface EntryMedia {
  /** Whether this item is an image or a video. */
  type: 'image' | 'video'
  /** Public URL to access the (encrypted) media file. */
  url: string
  /** Detected MIME type, e.g. `image/webp` or `video/mp4`. */
  mime: string
}

/**
 * A single guestbook entry stored in the database.
 */
export interface GuestEntry {
  id: string
  name: string
  message: string
  /**
   * URL of the first image, mirrored from {@link media} for backwards
   * compatibility (PDF export, OG sharing, analytics, legacy views).
   */
  photoUrl?: string
  /** All attached media (images and videos) in upload order. */
  media?: EntryMedia[]
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
  /**
   * @deprecated Use {@link media} instead. Kept for backwards compatibility;
   * when present and `media` is omitted it is treated as a single-item upload.
   */
  photo?: string // Base64-encoded image data
  /** Base64-encoded data URLs for images and/or videos, in display order. */
  media?: string[]
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
