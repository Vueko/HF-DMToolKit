import { useEffect, useState } from 'react'
import { useT } from '../../i18n'

function ImageViewer({ path }: { path: string }) {
    const t = useT()
    const [url, setUrl] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)
    const [zoom, setZoom] = useState(false)

    useEffect(() => {
        let revoked: string | null = null
        let cancelled = false
        window.electron.vault.readBinary(path).then((bytes) => {
            if (cancelled) return
            if (!bytes) { setFailed(true); return }
            const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)]))
            revoked = objectUrl
            setUrl(objectUrl)
        })
        return () => {
            cancelled = true
            if (revoked) URL.revokeObjectURL(revoked)
        }
    }, [path])

    if (failed) return <p className="text-ui-muted text-sm italic">{t('wiki.readError')}</p>
    if (!url) return <p className="text-ui-muted text-sm">{t('wiki.loadingVault')}</p>

    return (
        <div className="flex items-start justify-center">
            <img
                src={url}
                alt={path.split('/').pop() ?? ''}
                onClick={() => setZoom((z) => !z)}
                className={`rounded-lg border border-hope-gold/20 shadow-lg shadow-black/25 ${zoom ? 'max-w-none cursor-zoom-out' : 'max-w-full h-auto cursor-zoom-in'}`}
            />
        </div>
    )
}

export default ImageViewer
