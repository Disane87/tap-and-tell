/**
 * Composable for exporting guestbook entries to PDF.
 *
 * Uses jsPDF to generate a styled PDF document with all entries,
 * including photos, names, messages, and dates.
 */
import { jsPDF } from 'jspdf'
import type { GuestEntry } from '~/types/guest'

export function usePdfExport() {
  const isGenerating = ref(false)
  const progress = ref(0)

  /**
   * Converts an image URL to a base64 data URL.
   *
   * @param url - The image URL to convert.
   * @returns Promise resolving to base64 data URL or null if failed.
   */
  async function imageToBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  /**
   * Generates a PDF from the given entries.
   *
   * @param entries - The guest entries to include.
   * @param eventName - Optional event name for the cover page.
   * @param locale - Current locale for date formatting.
   */
  async function generatePdf(
    entries: GuestEntry[],
    eventName?: string,
    locale: string = 'en'
  ): Promise<void> {
    if (entries.length === 0) return

    isGenerating.value = true
    progress.value = 0

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - margin * 2

      // Cover page
      doc.setFillColor(24, 24, 27) // zinc-900
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(36)
      doc.text('Tap & Tell', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' })

      if (eventName) {
        doc.setFontSize(18)
        doc.text(eventName, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' })
      }

      doc.setFontSize(12)
      const dateStr = new Date().toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      doc.text(dateStr, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' })

      doc.setFontSize(10)
      doc.text(`${entries.length} ${entries.length === 1 ? 'Entry' : 'Entries'}`, pageWidth / 2, pageHeight - 30, { align: 'center' })

      progress.value = 10

      // Entry pages
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        doc.addPage()

        let yPos = margin

        // Background
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')

        // Photo (if available)
        if (entry.photoUrl) {
          const base64 = await imageToBase64(entry.photoUrl)
          if (base64) {
            try {
              const imgSize = 50
              doc.addImage(base64, 'JPEG', margin, yPos, imgSize, imgSize)
              yPos += imgSize + 10
            } catch {
              // Skip if image can't be added
            }
          }
        }

        // Name
        doc.setTextColor(24, 24, 27)
        doc.setFontSize(24)
        doc.text(entry.name, margin, yPos + 8)
        yPos += 15

        // Date
        doc.setTextColor(113, 113, 122) // zinc-500
        doc.setFontSize(10)
        const entryDate = new Date(entry.createdAt).toLocaleDateString(
          locale === 'de' ? 'de-DE' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        )
        doc.text(entryDate, margin, yPos)
        yPos += 15

        // Message
        doc.setTextColor(24, 24, 27)
        doc.setFontSize(12)
        const messageLines = doc.splitTextToSize(entry.message, contentWidth)
        doc.text(messageLines, margin, yPos)
        yPos += messageLines.length * 6 + 10

        // Answers section
        if (entry.answers) {
          const answers = entry.answers

          // Favorites
          const favorites: string[] = []
          if (answers.favoriteColor) favorites.push(`Color: ${answers.favoriteColor}`)
          if (answers.favoriteFood) favorites.push(`Food: ${answers.favoriteFood}`)
          if (answers.favoriteMovie) favorites.push(`Movie: ${answers.favoriteMovie}`)
          if (answers.favoriteSong?.title) {
            let songStr = `Song: ${answers.favoriteSong.title}`
            if (answers.favoriteSong.artist) songStr += ` by ${answers.favoriteSong.artist}`
            favorites.push(songStr)
          }

          if (favorites.length > 0) {
            doc.setFontSize(14)
            doc.setTextColor(24, 24, 27)
            doc.text('Favorites', margin, yPos)
            yPos += 8

            doc.setFontSize(10)
            doc.setTextColor(82, 82, 91)
            favorites.forEach(fav => {
              doc.text(`• ${fav}`, margin + 4, yPos)
              yPos += 5
            })
            yPos += 5
          }

          // Fun Facts
          const funFacts: string[] = []
          if (answers.superpower) funFacts.push(`Superpower: ${answers.superpower}`)
          if (answers.hiddenTalent) funFacts.push(`Hidden Talent: ${answers.hiddenTalent}`)
          if (answers.desertIslandItems) funFacts.push(`Desert Island: ${answers.desertIslandItems}`)
          if (answers.coffeeOrTea) funFacts.push(answers.coffeeOrTea === 'coffee' ? 'Coffee Person' : 'Tea Person')
          if (answers.nightOwlOrEarlyBird) funFacts.push(answers.nightOwlOrEarlyBird === 'night_owl' ? 'Night Owl' : 'Early Bird')
          if (answers.beachOrMountains) funFacts.push(answers.beachOrMountains === 'beach' ? 'Beach Lover' : 'Mountain Lover')

          if (funFacts.length > 0) {
            doc.setFontSize(14)
            doc.setTextColor(24, 24, 27)
            doc.text('Fun Facts', margin, yPos)
            yPos += 8

            doc.setFontSize(10)
            doc.setTextColor(82, 82, 91)
            funFacts.forEach(fact => {
              doc.text(`• ${fact}`, margin + 4, yPos)
              yPos += 5
            })
            yPos += 5
          }

          // Our Story
          const story: string[] = []
          if (answers.howWeMet) story.push(`How we met: ${answers.howWeMet}`)
          if (answers.bestMemory) story.push(`Best memory: ${answers.bestMemory}`)

          if (story.length > 0) {
            doc.setFontSize(14)
            doc.setTextColor(24, 24, 27)
            doc.text('Our Story', margin, yPos)
            yPos += 8

            doc.setFontSize(10)
            doc.setTextColor(82, 82, 91)
            story.forEach(item => {
              const lines = doc.splitTextToSize(item, contentWidth - 4)
              doc.text(lines, margin + 4, yPos)
              yPos += lines.length * 5 + 2
            })
          }
        }

        // Page number
        doc.setFontSize(8)
        doc.setTextColor(161, 161, 170)
        doc.text(`${i + 1} / ${entries.length}`, pageWidth - margin, pageHeight - 10, { align: 'right' })

        progress.value = 10 + Math.round((i / entries.length) * 85)
      }

      progress.value = 95

      // Save PDF
      const fileName = eventName
        ? `tap-and-tell-${eventName.toLowerCase().replace(/\s+/g, '-')}.pdf`
        : 'tap-and-tell-guestbook.pdf'

      doc.save(fileName)
      progress.value = 100
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generatePdf,
    isGenerating,
    progress
  }
}
