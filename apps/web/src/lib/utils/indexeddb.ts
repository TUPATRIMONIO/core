/**
 * Utilidad para persistir archivos en IndexedDB
 * Necesario porque File/Blob no se pueden guardar en localStorage
 */

const DB_NAME = 'tp_signing_wizard'
const STORE_NAME = 'files'
const FILE_KEY = 'current_pdf'

export async function saveFileToIndexedDB(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2) // Incrementar versión para forzar upgrade

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      const db = request.result
      // Verificar que el store existe antes de crear la transacción
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.warn('[IndexedDB] Object store not found, skipping save')
        resolve()
        return
      }
      try {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const putRequest = store.put(file, FILE_KEY)

        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } catch (err) {
        console.warn('[IndexedDB] Error creating transaction:', err)
        resolve() // No bloquear el flujo
      }
    }

    request.onerror = () => reject(request.error)
  })
}

export async function getFileFromIndexedDB(): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2)

    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve(null)
        return
      }
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(FILE_KEY)

      getRequest.onsuccess = () => resolve(getRequest.result || null)
      getRequest.onerror = () => reject(getRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}

export async function clearFileFromIndexedDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2)

    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        resolve()
        return
      }
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const deleteRequest = store.delete(FILE_KEY)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }

    request.onerror = () => reject(request.error)
  })
}


