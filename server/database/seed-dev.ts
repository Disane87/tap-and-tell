import { nanoid } from 'nanoid'
import Database from 'better-sqlite3'
import { hashPassword } from '~~/server/utils/password'

/** Well-known dev tenant ID for easy access during development. */
export const DEV_TENANT_ID = 'dev000tenant'

/** Well-known dev user ID. */
const DEV_USER_ID = 'dev00000user'

/** Well-known dev guestbook IDs. */
const DEV_GUESTBOOK_1 = 'dev00000gb01'
const DEV_GUESTBOOK_2 = 'dev00000gb02'

/** Dev user credentials. */
const DEV_EMAIL = 'dev@tap-and-tell.local'
const DEV_PASSWORD = 'dev123'
const DEV_USER_NAME = 'Dev Admin'

/** Dev tenant configuration. */
const DEV_TENANT_NAME = 'Dev Guestbook (All Features)'

/**
 * Seeds a development tenant with two guestbooks and sample entries.
 * Only runs when NODE_ENV !== 'production'. Idempotent — skips if the dev user already exists.
 *
 * @param dbPath - Path to the SQLite database file.
 */
export async function seedDevTenant(dbPath: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Check if dev user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(DEV_EMAIL)
  if (existing) {
    db.close()
    return
  }

  const passwordHash = await hashPassword(DEV_PASSWORD)

  // Create dev user
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
  ).run(DEV_USER_ID, DEV_EMAIL, passwordHash, DEV_USER_NAME)

  // Create dev tenant (no settings — settings live on guestbooks now)
  db.prepare(
    'INSERT INTO tenants (id, name, owner_id) VALUES (?, ?, ?)'
  ).run(DEV_TENANT_ID, DEV_TENANT_NAME, DEV_USER_ID)

  // Add owner membership
  db.prepare(
    'INSERT INTO tenant_members (id, tenant_id, user_id, role) VALUES (?, ?, ?, ?)'
  ).run(nanoid(12), DEV_TENANT_ID, DEV_USER_ID, 'owner')

  const now = new Date().toISOString()

  // Create guestbook 1: permanent (Welcome Home)
  const gb1Settings = JSON.stringify({
    moderationEnabled: true,
    welcomeMessage: 'Willkommen zum Dev-Guestbook! Hinterlasse eine Nachricht.',
    themeColor: '#6366f1'
  })

  db.prepare(`
    INSERT INTO guestbooks (id, tenant_id, name, type, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(DEV_GUESTBOOK_1, DEV_TENANT_ID, 'Welcome Home', 'permanent', gb1Settings, now, now)

  // Create guestbook 2: event (Silvester 2025)
  const gb2Settings = JSON.stringify({
    moderationEnabled: false,
    welcomeMessage: 'Frohes neues Jahr! Hinterlasse einen Gruß.',
    themeColor: '#f59e0b'
  })

  db.prepare(`
    INSERT INTO guestbooks (id, tenant_id, name, type, settings, start_date, end_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    DEV_GUESTBOOK_2, DEV_TENANT_ID, 'Silvester 2025', 'event', gb2Settings,
    '2025-12-31', '2026-01-01', now, now
  )

  // Insert sample entries for guestbook 1
  const sampleEntries = [
    {
      name: 'Maria Schmidt',
      message: 'Was für ein wundervoller Abend! Danke für die Einladung.',
      status: 'approved',
      answers: {
        favoriteColor: 'Blau',
        favoriteFood: 'Pizza',
        favoriteMovie: 'Inception',
        superpower: 'Zeitreisen',
        coffeeOrTea: 'coffee',
        beachOrMountains: 'mountains',
        howWeMet: 'Beim Sommerfest 2023',
        bestMemory: 'Unser gemeinsamer Roadtrip nach Italien'
      }
    },
    {
      name: 'Thomas Müller',
      message: 'Immer wieder gerne! Bis zum nächsten Mal.',
      status: 'approved',
      answers: {
        favoriteColor: 'Grün',
        favoriteFood: 'Sushi',
        favoriteSong: { title: 'Bohemian Rhapsody', artist: 'Queen' },
        hiddenTalent: 'Jonglieren',
        nightOwlOrEarlyBird: 'night_owl',
        beachOrMountains: 'beach',
        howWeMet: 'Über gemeinsame Freunde',
        bestMemory: 'Silvester 2022'
      }
    },
    {
      name: 'Lisa Weber',
      message: 'Einfach toll hier! Die Deko war großartig.',
      status: 'pending',
      answers: {
        favoriteColor: 'Lila',
        favoriteMovie: 'The Grand Budapest Hotel',
        desertIslandItems: 'Buch, Gitarre, Sonnencreme',
        coffeeOrTea: 'tea',
        nightOwlOrEarlyBird: 'early_bird'
      }
    },
    {
      name: 'Max Bauer',
      message: 'Test-Eintrag der abgelehnt wurde.',
      status: 'rejected',
      rejectionReason: 'Testeintrag – kein echter Gast',
      answers: {}
    }
  ]

  const insertEntry = db.prepare(`
    INSERT INTO entries (id, guestbook_id, name, message, photo_url, answers, status, rejection_reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const baseTime = new Date()
  for (let i = 0; i < sampleEntries.length; i++) {
    const entry = sampleEntries[i]
    const createdAt = new Date(baseTime.getTime() - (i * 3600000)).toISOString()
    insertEntry.run(
      nanoid(12),
      DEV_GUESTBOOK_1,
      entry.name,
      entry.message,
      null,
      JSON.stringify(entry.answers),
      entry.status,
      entry.rejectionReason || null,
      createdAt
    )
  }

  db.close()

  console.log(`[seed-dev] Dev tenant created: ${DEV_TENANT_ID}`)
  console.log(`[seed-dev] Guestbook 1 (permanent): ${DEV_GUESTBOOK_1}`)
  console.log(`[seed-dev] Guestbook 2 (event): ${DEV_GUESTBOOK_2}`)
  console.log(`[seed-dev] Login: ${DEV_EMAIL} / ${DEV_PASSWORD}`)
  console.log(`[seed-dev] Guest URL: /t/${DEV_TENANT_ID}/g/${DEV_GUESTBOOK_1}`)
  console.log(`[seed-dev] Admin URL: /t/${DEV_TENANT_ID}/admin`)
}
