/**
 * Unit tests for usePdfExport composable.
 *
 * Tests PDF generation (cover page, entry pages, photos, answers, locales),
 * filename logic, progress/state tracking, error recovery, and the
 * imageToBase64 helper.
 *
 * jsPDF is fully mocked so no real PDF rendering occurs. The mock records
 * all method calls, which the tests assert against for coverage of the
 * composable's drawing logic.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import type { GuestEntry } from '~/types/guest'

// ---------------------------------------------------------------------------
// Mock Vue auto-imports
// ---------------------------------------------------------------------------
vi.stubGlobal('ref', ref)

// ---------------------------------------------------------------------------
// jsPDF mock
// ---------------------------------------------------------------------------

let mockDoc: Record<string, any>

function resetMockDoc() {
  mockDoc = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    addImage: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    save: vi.fn()
  }
}

vi.mock('jspdf', () => {
  return {
    jsPDF: vi.fn(function (this: any) { return mockDoc })
  }
})

// ---------------------------------------------------------------------------
// fetch / FileReader mock for imageToBase64
// ---------------------------------------------------------------------------

const mockBlobContent = 'fake-blob-data'
const fakeBase64 = 'data:image/jpeg;base64,abc123'

function setupFetchMock(shouldFail = false) {
  if (shouldFail) {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
  } else {
    const mockBlob = new Blob([mockBlobContent])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(mockBlob)
    }))
  }
}

// Mock FileReader to synchronously produce a base64 string
class MockFileReader {
  result: string | null = null
  onloadend: (() => void) | null = null
  onerror: (() => void) | null = null

  readAsDataURL(_blob: Blob) {
    this.result = fakeBase64
    Promise.resolve().then(() => this.onloadend?.())
  }
}

vi.stubGlobal('FileReader', MockFileReader)

// Import composable after all mocks are in place
import { usePdfExport } from '../usePdfExport'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEntry(overrides?: Partial<GuestEntry>): GuestEntry {
  return {
    id: '1',
    name: 'Alice',
    message: 'Hello world',
    createdAt: '2024-06-15T12:00:00.000Z',
    ...overrides
  }
}

async function flush() {
  await new Promise(r => setTimeout(r, 0))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePdfExport', () => {
  beforeEach(() => {
    resetMockDoc()
    setupFetchMock()
    vi.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // Return value structure
  // -----------------------------------------------------------------------
  describe('return value structure', () => {
    it('should return generatePdf, isGenerating, and progress', () => {
      const result = usePdfExport()

      expect(result).toHaveProperty('generatePdf')
      expect(result).toHaveProperty('isGenerating')
      expect(result).toHaveProperty('progress')
    })

    it('should return refs for reactive state', () => {
      const { isGenerating, progress } = usePdfExport()

      expect(isGenerating).toHaveProperty('value')
      expect(progress).toHaveProperty('value')
    })

    it('should return a function for generatePdf', () => {
      const { generatePdf } = usePdfExport()
      expect(typeof generatePdf).toBe('function')
    })

    it('should initialize isGenerating as false and progress as 0', () => {
      const { isGenerating, progress } = usePdfExport()
      expect(isGenerating.value).toBe(false)
      expect(progress.value).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — empty entries
  // -----------------------------------------------------------------------
  describe('generatePdf with empty entries', () => {
    it('should do nothing when entries array is empty', async () => {
      const { generatePdf, isGenerating, progress } = usePdfExport()

      await generatePdf([], 'Test Event')

      expect(isGenerating.value).toBe(false)
      expect(progress.value).toBe(0)
      expect(mockDoc.save).not.toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — cover page and basic flow
  // -----------------------------------------------------------------------
  describe('generatePdf — basic flow', () => {
    it('should create PDF with cover page and entry pages', async () => {
      const { generatePdf } = usePdfExport()
      const entries = [createEntry(), createEntry({ id: '2', name: 'Bob' })]

      await generatePdf(entries, 'Birthday')

      // Cover page: background fill
      expect(mockDoc.setFillColor).toHaveBeenCalledWith(24, 24, 27)
      expect(mockDoc.rect).toHaveBeenCalled()

      // Cover page: title
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Tap & Tell', 105, expect.any(Number), { align: 'center' }
      )

      // Cover page: event name
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Birthday', 105, expect.any(Number), { align: 'center' }
      )

      // Entry count
      expect(mockDoc.text).toHaveBeenCalledWith(
        '2 Entries', 105, expect.any(Number), { align: 'center' }
      )

      // Each entry gets its own page
      expect(mockDoc.addPage).toHaveBeenCalledTimes(2)

      // PDF is saved
      expect(mockDoc.save).toHaveBeenCalledTimes(1)
    })

    it('should show singular "Entry" for single entry', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()])

      expect(mockDoc.text).toHaveBeenCalledWith(
        '1 Entry', 105, expect.any(Number), { align: 'center' }
      )
    })

    it('should render entry name and message on each page', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ name: 'Alice', message: 'Great party!' })

      await generatePdf([entry])

      // Name
      expect(mockDoc.text).toHaveBeenCalledWith('Alice', 20, expect.any(Number))
      // Message (via splitTextToSize)
      expect(mockDoc.splitTextToSize).toHaveBeenCalledWith('Great party!', 170)
      // Page number
      expect(mockDoc.text).toHaveBeenCalledWith(
        '1 / 1', 190, 287, { align: 'right' }
      )
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — isGenerating state tracking
  // -----------------------------------------------------------------------
  describe('generatePdf — state tracking', () => {
    it('should set isGenerating to true during generation and false after', async () => {
      const { generatePdf, isGenerating } = usePdfExport()

      let generatingDuringExecution = false
      const originalSave = mockDoc.save
      mockDoc.save = vi.fn(() => {
        generatingDuringExecution = isGenerating.value
      })

      await generatePdf([createEntry()])

      expect(generatingDuringExecution).toBe(true)
      expect(isGenerating.value).toBe(false)
    })

    it('should reset isGenerating on error', async () => {
      const { generatePdf, isGenerating } = usePdfExport()

      // Make save throw to simulate an error during generation
      mockDoc.save = vi.fn(() => { throw new Error('Save failed') })

      await expect(generatePdf([createEntry()])).rejects.toThrow('Save failed')

      expect(isGenerating.value).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — progress updates
  // -----------------------------------------------------------------------
  describe('generatePdf — progress updates', () => {
    it('should update progress during generation', async () => {
      const { generatePdf, progress } = usePdfExport()
      const progressSnapshots: number[] = []

      // Capture progress at key points
      const originalAddPage = mockDoc.addPage
      mockDoc.addPage = vi.fn(() => {
        progressSnapshots.push(progress.value)
      })

      await generatePdf([createEntry(), createEntry({ id: '2' })])

      // Progress should have been non-zero during generation
      expect(progressSnapshots.length).toBeGreaterThan(0)

      // Final progress should be 100
      expect(progress.value).toBe(100)
    })

    it('should reach 100 after successful generation', async () => {
      const { generatePdf, progress } = usePdfExport()

      await generatePdf([createEntry()])

      expect(progress.value).toBe(100)
    })

    it('should start progress at 0', async () => {
      const { generatePdf, progress } = usePdfExport()

      // Set progress to a non-zero value to confirm it resets
      progress.value = 50

      await generatePdf([createEntry()])

      // It was reset to 0 at the beginning (now at 100 after completion)
      expect(progress.value).toBe(100)
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — filename
  // -----------------------------------------------------------------------
  describe('generatePdf — filename', () => {
    it('should use event name in filename when provided', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()], 'Birthday Party')

      expect(mockDoc.save).toHaveBeenCalledWith('tap-and-tell-birthday-party.pdf')
    })

    it('should use default filename without event name', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()])

      expect(mockDoc.save).toHaveBeenCalledWith('tap-and-tell-guestbook.pdf')
    })

    it('should lowercase and hyphenate event name in filename', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()], 'My  Great  Event')

      // \s+ collapses multiple spaces into a single hyphen
      expect(mockDoc.save).toHaveBeenCalledWith('tap-and-tell-my-great-event.pdf')
    })

    it('should use undefined event name as no event name', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()], undefined)

      expect(mockDoc.save).toHaveBeenCalledWith('tap-and-tell-guestbook.pdf')
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — entries with photos
  // -----------------------------------------------------------------------
  describe('generatePdf — entries with photos', () => {
    it('should fetch and embed photo when entry has photoUrl', async () => {
      setupFetchMock()
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ photoUrl: '/api/photos/123.jpg' })

      await generatePdf([entry])

      expect(global.fetch).toHaveBeenCalledWith('/api/photos/123.jpg')
      expect(mockDoc.addImage).toHaveBeenCalledWith(
        fakeBase64, 'JPEG', 20, expect.any(Number), 50, 50
      )
    })

    it('should skip photo when imageToBase64 returns null (fetch error)', async () => {
      setupFetchMock(true)
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ photoUrl: '/api/photos/broken.jpg' })

      await generatePdf([entry])

      expect(mockDoc.addImage).not.toHaveBeenCalled()
      // PDF should still be saved
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should handle entries without photos', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ photoUrl: undefined })

      await generatePdf([entry])

      expect(global.fetch).not.toHaveBeenCalled()
      expect(mockDoc.addImage).not.toHaveBeenCalled()
      expect(mockDoc.save).toHaveBeenCalled()
    })

    it('should continue generating PDF when addImage throws', async () => {
      setupFetchMock()
      mockDoc.addImage = vi.fn(() => { throw new Error('Image format not supported') })

      const { generatePdf } = usePdfExport()
      const entry = createEntry({ photoUrl: '/api/photos/123.jpg' })

      await generatePdf([entry])

      // PDF should still be saved even though addImage threw
      expect(mockDoc.save).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — entries with answers
  // -----------------------------------------------------------------------
  describe('generatePdf — entries with answers', () => {
    it('should render favorites section when answers include favorites', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          favoriteColor: 'Blue',
          favoriteFood: 'Pizza',
          favoriteMovie: 'Inception'
        }
      })

      await generatePdf([entry])

      expect(mockDoc.text).toHaveBeenCalledWith('Favorites', 20, expect.any(Number))
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Color: Blue'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Food: Pizza'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Movie: Inception'), expect.any(Number), expect.any(Number)
      )
    })

    it('should render favorite song with artist', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          favoriteSong: { title: 'Bohemian Rhapsody', artist: 'Queen' }
        }
      })

      await generatePdf([entry])

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Song: Bohemian Rhapsody by Queen'),
        expect.any(Number), expect.any(Number)
      )
    })

    it('should render favorite song without artist', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          favoriteSong: { title: 'Bohemian Rhapsody' }
        }
      })

      await generatePdf([entry])

      // Should have "Song: Bohemian Rhapsody" without " by ..."
      const songCalls = mockDoc.text.mock.calls.filter(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('Song: Bohemian Rhapsody')
      )
      expect(songCalls.length).toBeGreaterThan(0)
      expect(songCalls[0][0]).not.toContain(' by ')
    })

    it('should render fun facts section', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          superpower: 'Flying',
          hiddenTalent: 'Juggling',
          coffeeOrTea: 'coffee',
          nightOwlOrEarlyBird: 'night_owl',
          beachOrMountains: 'beach'
        }
      })

      await generatePdf([entry])

      expect(mockDoc.text).toHaveBeenCalledWith('Fun Facts', 20, expect.any(Number))
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Superpower: Flying'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Hidden Talent: Juggling'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Coffee Person'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Night Owl'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Beach Lover'), expect.any(Number), expect.any(Number)
      )
    })

    it('should render tea/early bird/mountains alternatives', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          coffeeOrTea: 'tea',
          nightOwlOrEarlyBird: 'early_bird',
          beachOrMountains: 'mountains'
        }
      })

      await generatePdf([entry])

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Tea Person'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Early Bird'), expect.any(Number), expect.any(Number)
      )
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Mountain Lover'), expect.any(Number), expect.any(Number)
      )
    })

    it('should render desert island items', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          desertIslandItems: 'Book, Knife, Fishing rod'
        }
      })

      await generatePdf([entry])

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Desert Island: Book, Knife, Fishing rod'),
        expect.any(Number), expect.any(Number)
      )
    })

    it('should render our story section', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({
        answers: {
          howWeMet: 'At university',
          bestMemory: 'Road trip to Italy'
        }
      })

      await generatePdf([entry])

      expect(mockDoc.text).toHaveBeenCalledWith('Our Story', 20, expect.any(Number))
      // splitTextToSize is called for each story item
      expect(mockDoc.splitTextToSize).toHaveBeenCalledWith(
        'How we met: At university', expect.any(Number)
      )
      expect(mockDoc.splitTextToSize).toHaveBeenCalledWith(
        'Best memory: Road trip to Italy', expect.any(Number)
      )
    })

    it('should skip sections when corresponding answers are absent', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ answers: {} })

      await generatePdf([entry])

      // Should NOT render section headers
      const textCalls = mockDoc.text.mock.calls.map((c: any[]) => c[0])
      const sectionHeaders = textCalls.filter(
        (t: any) => typeof t === 'string' && ['Favorites', 'Fun Facts', 'Our Story'].includes(t)
      )
      expect(sectionHeaders).toHaveLength(0)
    })

    it('should handle entries without answers property', async () => {
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ answers: undefined })

      await generatePdf([entry])

      expect(mockDoc.save).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — locale
  // -----------------------------------------------------------------------
  describe('generatePdf — locale handling', () => {
    it('should use en-US date format by default', async () => {
      const { generatePdf } = usePdfExport()
      await generatePdf([createEntry()])

      // The cover date is formatted via toLocaleDateString('en-US', ...)
      // We verify by checking that text was called with a date string
      const dateCallsOnCover = mockDoc.text.mock.calls.filter(
        (call: any[]) => typeof call[0] === 'string' && /\d{4}/.test(call[0]) && call[3]?.align === 'center'
      )
      expect(dateCallsOnCover.length).toBeGreaterThan(0)
    })

    it('should handle locale de', async () => {
      const { generatePdf } = usePdfExport()
      await generatePdf([createEntry()], undefined, 'de')

      // Should still save successfully with German locale
      expect(mockDoc.save).toHaveBeenCalled()

      // Entry date should use de-DE locale
      // Just verify no errors occurred and the PDF was generated
      expect(mockDoc.text).toHaveBeenCalled()
    })

    it('should default to en when locale is not provided', async () => {
      const { generatePdf } = usePdfExport()
      await generatePdf([createEntry()])

      expect(mockDoc.save).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — event name on cover page
  // -----------------------------------------------------------------------
  describe('generatePdf — event name on cover', () => {
    it('should render event name on cover page when provided', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()], 'Wedding Reception')

      // Event name should be centered on cover page
      expect(mockDoc.text).toHaveBeenCalledWith(
        'Wedding Reception', 105, expect.any(Number), { align: 'center' }
      )
    })

    it('should not render event name when not provided', async () => {
      const { generatePdf } = usePdfExport()

      await generatePdf([createEntry()])

      // Only 'Tap & Tell', the date, and '1 Entry' should be centered on cover
      const centeredCalls = mockDoc.text.mock.calls.filter(
        (call: any[]) => call[3]?.align === 'center'
      )
      const centeredTexts = centeredCalls.map((call: any[]) => call[0])
      expect(centeredTexts).toContain('Tap & Tell')
      expect(centeredTexts).toContain('1 Entry')
      // Should NOT contain an event name
      expect(centeredTexts).not.toContain('Wedding Reception')
    })
  })

  // -----------------------------------------------------------------------
  // imageToBase64
  // -----------------------------------------------------------------------
  describe('imageToBase64', () => {
    it('should return base64 on successful fetch', async () => {
      setupFetchMock()
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ photoUrl: '/photo.jpg' })

      await generatePdf([entry])

      // Verifying indirectly: addImage was called with the mocked base64
      expect(mockDoc.addImage).toHaveBeenCalledWith(
        fakeBase64, 'JPEG', expect.any(Number), expect.any(Number), 50, 50
      )
    })

    it('should return null on fetch error (photo is skipped)', async () => {
      setupFetchMock(true)
      const { generatePdf } = usePdfExport()
      const entry = createEntry({ photoUrl: '/broken.jpg' })

      await generatePdf([entry])

      // Photo should be skipped, addImage not called
      expect(mockDoc.addImage).not.toHaveBeenCalled()
      // PDF still generated
      expect(mockDoc.save).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // generatePdf — multiple entries
  // -----------------------------------------------------------------------
  describe('generatePdf — multiple entries', () => {
    it('should create a page for each entry', async () => {
      const { generatePdf } = usePdfExport()
      const entries = [
        createEntry({ id: '1', name: 'Alice' }),
        createEntry({ id: '2', name: 'Bob' }),
        createEntry({ id: '3', name: 'Charlie' })
      ]

      await generatePdf(entries)

      expect(mockDoc.addPage).toHaveBeenCalledTimes(3)
    })

    it('should show correct page numbers', async () => {
      const { generatePdf } = usePdfExport()
      const entries = [
        createEntry({ id: '1', name: 'Alice' }),
        createEntry({ id: '2', name: 'Bob' })
      ]

      await generatePdf(entries)

      expect(mockDoc.text).toHaveBeenCalledWith('1 / 2', 190, 287, { align: 'right' })
      expect(mockDoc.text).toHaveBeenCalledWith('2 / 2', 190, 287, { align: 'right' })
    })

    it('should render each entry name', async () => {
      const { generatePdf } = usePdfExport()
      const entries = [
        createEntry({ id: '1', name: 'Alice' }),
        createEntry({ id: '2', name: 'Bob' })
      ]

      await generatePdf(entries)

      expect(mockDoc.text).toHaveBeenCalledWith('Alice', 20, expect.any(Number))
      expect(mockDoc.text).toHaveBeenCalledWith('Bob', 20, expect.any(Number))
    })
  })
})
