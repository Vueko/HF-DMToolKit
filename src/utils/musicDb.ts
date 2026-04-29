const DB_NAME = 'dh-music'
const STORE_NAME = 'tracks'
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
                console.warn('[MusicDB] IndexedDB unavailable (private mode?). Audio files will not persist.')
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

export async function saveTrackFile(id: string, file: File): Promise<void> {
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

export async function getTrackUrl(id: string): Promise<string | null> {
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

export async function deleteTrackFile(id: string): Promise<void> {
    const db = await openDb()
    if (!db) return
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(STORE_NAME, 'readwrite')
            tx.objectStore(STORE_NAME).delete(id)
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
        } catch {
            resolve()
        }
    })
}
