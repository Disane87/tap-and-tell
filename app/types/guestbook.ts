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
  /** Custom text color for guest-facing pages. */
  textColor?: string
  /** URL for a header image. */
  headerImageUrl?: string
  /** Position of the header image relative to the title. */
  headerImagePosition?: 'above-title' | 'below-title' | 'behind-title'
  /** Custom background color for guest-facing pages. */
  backgroundColor?: string
  /** URL for a background image. */
  backgroundImageUrl?: string
  /** Form configuration controlling which steps and fields are shown. */
  formConfig?: {
    steps: { basics: boolean; favorites: boolean; funFacts: boolean; message: boolean }
    fields?: Record<string, boolean>
  }
  /** Custom hex color for the info card background on the landing page. */
  cardColor?: string
  /** Card background opacity 0–100 (percentage), default 70. */
  cardOpacity?: number
  /** Card backdrop blur in pixels (0–30), default 20. */
  cardBlur?: number
  /** Font for titles/headings: 'handwritten' (Caveat), 'display' (DM Sans), or 'sans' (Inter). */
  titleFont?: 'handwritten' | 'display' | 'sans'
  /** Font for body text: 'sans' (Inter), 'display' (DM Sans), or 'handwritten' (Caveat). */
  bodyFont?: 'sans' | 'display' | 'handwritten'
  /** Custom labels for form fields. */
  customLabels?: Record<string, string>
  /** Custom CTA button text for the landing page (e.g., "Sign the guestbook", "Leave your wishes"). */
  ctaButtonText?: string
  /** Card style variant for entry cards. */
  cardStyle?: 'polaroid' | 'minimal' | 'rounded' | 'bordered'
  /** Custom questions for the form wizard. */
  customQuestions?: CustomQuestion[]
  /** View layout for the guestbook entries page. */
  viewLayout?: 'grid' | 'masonry' | 'list' | 'timeline'
  /** Default slideshow auto-advance interval in seconds. */
  slideshowInterval?: 3 | 5 | 8 | 10 | 15 | 30
  /** Slideshow transition effect. */
  slideshowTransition?: 'fade' | 'slide' | 'zoom'
  /** Whether to show answer badges overlay in slideshow. */
  slideshowShowBadges?: boolean
  /** Whether to show guest names overlay in slideshow. */
  slideshowShowNames?: boolean
  /** Forced color scheme for guest pages (overrides system preference). */
  colorScheme?: 'system' | 'light' | 'dark'
  /** Optional footer text displayed below CTA. */
  footerText?: string
  /** Social media links displayed in footer. */
  socialLinks?: SocialLink[]
}

/**
 * A social media link for the guestbook footer.
 */
export interface SocialLink {
  /** Platform identifier (instagram, twitter, website, youtube, tiktok). */
  platform: 'instagram' | 'twitter' | 'website' | 'youtube' | 'tiktok'
  /** Full URL to the profile or page. */
  url: string
}

/**
 * A custom question defined by the guestbook owner.
 */
export interface CustomQuestion {
  /** Unique identifier (nanoid). */
  id: string
  /** Question text displayed to guests. */
  label: string
  /** Input type: text (single line), textarea (multiline), or choice (select). */
  type: 'text' | 'textarea' | 'choice'
  /** Options for choice type. */
  options?: string[]
  /** Whether the question is required. */
  required?: boolean
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
