import { nanoid } from 'nanoid'
import { Pool } from 'pg'
import { hashPassword } from '~~/server/utils/password'
import { generateEncryptionSalt } from '~~/server/utils/crypto'

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
 * @param connectionString - PostgreSQL connection string.
 */
export async function seedDevTenant(connectionString: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    // Check if dev user already exists
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [DEV_EMAIL])
    if (existing.rows.length > 0) {
      return
    }

    const passwordHash = await hashPassword(DEV_PASSWORD)
    const encryptionSalt = generateEncryptionSalt()
    const now = new Date()

    await client.query('BEGIN')

    // Create dev user
    await client.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [DEV_USER_ID, DEV_EMAIL, passwordHash, DEV_USER_NAME]
    )

    // Create dev tenant with encryption salt
    await client.query(
      'INSERT INTO tenants (id, name, owner_id, encryption_salt) VALUES ($1, $2, $3, $4)',
      [DEV_TENANT_ID, DEV_TENANT_NAME, DEV_USER_ID, encryptionSalt]
    )

    // Add owner membership
    await client.query(
      'INSERT INTO tenant_members (id, tenant_id, user_id, role) VALUES ($1, $2, $3, $4)',
      [nanoid(12), DEV_TENANT_ID, DEV_USER_ID, 'owner']
    )

    // Create guestbook 1: permanent (Welcome Home)
    const gb1Settings = JSON.stringify({
      moderationEnabled: true,
      welcomeMessage: 'Willkommen zum Dev-Guestbook! Hinterlasse eine Nachricht.',
      themeColor: '#6366f1'
    })

    await client.query(
      `INSERT INTO guestbooks (id, tenant_id, name, type, settings, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [DEV_GUESTBOOK_1, DEV_TENANT_ID, 'Welcome Home', 'permanent', gb1Settings, now, now]
    )

    // Create guestbook 2: event (Silvester 2025)
    const gb2Settings = JSON.stringify({
      moderationEnabled: false,
      welcomeMessage: 'Frohes neues Jahr! Hinterlasse einen Gruß.',
      themeColor: '#f59e0b'
    })

    await client.query(
      `INSERT INTO guestbooks (id, tenant_id, name, type, settings, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [DEV_GUESTBOOK_2, DEV_TENANT_ID, 'Silvester 2025', 'event', gb2Settings,
        new Date('2025-12-31'), new Date('2026-01-01'), now, now]
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

    const baseTime = new Date()
    for (let i = 0; i < sampleEntries.length; i++) {
      const entry = sampleEntries[i]
      const createdAt = new Date(baseTime.getTime() - (i * 3600000))
      await client.query(
        `INSERT INTO entries (id, guestbook_id, name, message, photo_url, answers, status, rejection_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          nanoid(12),
          DEV_GUESTBOOK_1,
          entry.name,
          entry.message,
          null,
          JSON.stringify(entry.answers),
          entry.status,
          entry.rejectionReason || null,
          createdAt
        ]
      )
    }

    await client.query('COMMIT')

    console.log(`[seed-dev] Dev tenant created: ${DEV_TENANT_ID}`)
    console.log(`[seed-dev] Guestbook 1 (permanent): ${DEV_GUESTBOOK_1}`)
    console.log(`[seed-dev] Guestbook 2 (event): ${DEV_GUESTBOOK_2}`)
    console.log(`[seed-dev] Login: ${DEV_EMAIL} / ${DEV_PASSWORD}`)
    console.log(`[seed-dev] Guest URL: /t/${DEV_TENANT_ID}/g/${DEV_GUESTBOOK_1}`)
    console.log(`[seed-dev] Admin URL: /t/${DEV_TENANT_ID}/admin`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}
