export type VaultViewer = 'markdown' | 'image' | 'pdf' | 'doc'

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

export function viewerForPath(path: string): VaultViewer {
    const lower = path.toLowerCase()
    const ext = lower.includes('.') ? lower.split('.').pop() ?? '' : ''
    if (IMAGE_EXT.has(ext)) return 'image'
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx') return 'doc'
    return 'markdown'
}
