/**
 * Guestbook type: permanent (home, shop) or event (wedding, birthday — with dates).
 */
export type GuestbookType = 'permanent' | 'event'

/**
 * Settings for a guestbook instance.
 */
export interface GuestbookSettings {
  /** Whether entries require moderation before appearing publicly. */
  moderationEnabled?: boolean
  /** Custom welcome message for guests. */
  welcomeMessage?: string
  /** Custom theme color. */
  themeColor?: string
  /** URL for a header image. */
  headerImageUrl?: string
  /** URL for a background image. */
  backgroundImageUrl?: string
  /** Form configuration controlling which steps and fields are shown. */
  formConfig?: {
    steps: { basics: boolean; favorites: boolean; funFacts: boolean; message: boolean }
    fields?: Record<string, boolean>
  }
  /** Custom labels for form fields. */
  customLabels?: Record<string, string>
}

/**
 * A guestbook instance belonging to a tenant.
 */
export interface Guestbook {
  id: string
  tenantId: string
  name: string
  type: GuestbookType
  settings: GuestbookSettings
  startDate?: string
  endDate?: string
  createdAt: string
  updatedAt: string
  entryCount?: number
}

/**
 * Input for creating a new guestbook.
 */
export interface CreateGuestbookInput {
  name: string
  type?: GuestbookType
  settings?: GuestbookSettings
  startDate?: string
  endDate?: string
}

/**
 * Input for updating an existing guestbook.
 */
export interface UpdateGuestbookInput {
  name?: string
  type?: GuestbookType
  settings?: GuestbookSettings
  startDate?: string
  endDate?: string
}
