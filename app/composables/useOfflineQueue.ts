/**
 * Composable for queuing entries when offline and syncing when online.
 *
 * Uses IndexedDB to store entries that couldn't be submitted due to
 * network issues, then syncs them when connection is restored.
 */
import type { CreateGuestEntryInput } from '~/types/guest'

const DB_NAME = 'tap-and-tell-offline'
const STORE_NAME = 'pending-entries'
const DB_VERSION = 1

interface QueuedEntry {
  id: string
  entry: CreateGuestEntryInput
  timestamp: number
}

export function useOfflineQueue() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const pendingCount = ref(0)
  const isSyncing = ref(false)

  let db: IDBDatabase | null = null

  /**
   * Opens or creates the IndexedDB database.
   */
  async function openDatabase(): Promise<IDBDatabase> {
    if (db) return db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Adds an entry to the offline queue.
   *
   * @param entry - The entry data to queue.
   */
  async function queueEntry(entry: CreateGuestEntryInput): Promise<void> {
    const database = await openDatabase()
    const queuedEntry: QueuedEntry = {
      id: crypto.randomUUID(),
      entry,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(queuedEntry)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        pendingCount.value++
        resolve()
      }
    })
  }

  /**
   * Gets all pending entries from the queue.
   */
  async function getPendingEntries(): Promise<QueuedEntry[]> {
    const database = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Removes an entry from the queue.
   *
   * @param id - The queue entry ID to remove.
   */
  async function removeFromQueue(id: string): Promise<void> {
    const database = await openDatabase()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        pendingCount.value = Math.max(0, pendingCount.value - 1)
        resolve()
      }
    })
  }

  /**
   * Attempts to sync all pending entries with the server.
   *
   * @param submitFn - Function to submit an entry to the server.
   * @returns Number of successfully synced entries.
   */
  async function syncPendingEntries(
    submitFn: (entry: CreateGuestEntryInput) => Promise<boolean>
  ): Promise<number> {
    if (!isOnline.value || isSyncing.value) return 0

    isSyncing.value = true
    let syncedCount = 0

    try {
      const entries = await getPendingEntries()

      for (const queuedEntry of entries) {
        try {
          const success = await submitFn(queuedEntry.entry)
          if (success) {
            await removeFromQueue(queuedEntry.id)
            syncedCount++
          }
        } catch {
          // Continue with next entry if one fails
        }
      }
    } finally {
      isSyncing.value = false
    }

    return syncedCount
  }

  /**
   * Updates the pending count from the database.
   */
  async function refreshPendingCount(): Promise<void> {
    try {
      const entries = await getPendingEntries()
      pendingCount.value = entries.length
    } catch {
      pendingCount.value = 0
    }
  }

  /**
   * Sets up online/offline event listeners.
   */
  function setupListeners(): void {
    if (typeof window === 'undefined') return

    const updateOnlineStatus = () => {
      isOnline.value = navigator.onLine
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Initial count
    refreshPendingCount()
  }

  return {
    isOnline,
    pendingCount,
    isSyncing,
    queueEntry,
    getPendingEntries,
    removeFromQueue,
    syncPendingEntries,
    refreshPendingCount,
    setupListeners
  }
}
