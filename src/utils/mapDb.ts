const DB_NAME = 'dh-map'
const STORE_NAME = 'images'
const DB_VERSION = 1

let dbInstance: IDBDatabase | null = null
let dbUnavailable = false

function openDb(): Promise<IDBDatabase | null> {
    if (dbUnavailable) return Promise.resolve(null)
    if (dbInstance) return Promise.resolve(dbInstance)
    return new Promise((resolve) => {
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION)
            req.onupgradeneeded = () => {
                req.result.createObjectStore(STORE_NAME)
            }
            req.onsuccess = () => {
                dbInstance = req.result
                dbInstance.onclose = () => { dbInstance = null }
                resolve(dbInstance)
            }
            req.onerror = () => {
                dbUnavailable = true
                console.warn('[MapDB] IndexedDB unavailable (private mode?). Map images will not persist.')
                resolve(null)
            }
            req.onblocked = () => {
                dbUnavailable = true
                resolve(null)
            }
        } catch {
            dbUnavailable = true
            resolve(null)
        }
    })
}

export async function saveMapImage(id: string, file: File): Promise<void> {
    const db = await openDb()
    if (!db) return
    return new Promise((resolve, reject) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            tx.objectStore(STORE_NAME).put(file, id)
            tx.oncomplete = () => resolve()
            tx.onerror = () => reject(tx.error)
        } catch (e) {
            reject(e)
        }
    })
}

export async function getMapImage(id: string): Promise<string | null> {
    const db = await openDb()
    if (!db) return null
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readonly')
            const req = tx.objectStore(STORE_NAME).get(id)
            req.onsuccess = () => {
                if (req.result instanceof Blob) {
                    resolve(URL.createObjectURL(req.result))
                } else {
                    resolve(null)
                }
            }
            req.onerror = () => resolve(null)
        } catch {
            resolve(null)
        }
    })
}
