import { useState, useEffect } from 'react'

interface OverlayState {
    dataUrl: string
    name: string
}

function PlayerScreen() {
    const [mapUrl, setMapUrl] = useState<string | null>(null)
    const [overlay, setOverlay] = useState<OverlayState | null>(null)

    useEffect(() => {
        let mounted = true

        const toDataUrl = async (storedId: string): Promise<string | null> => {
            const data = await window.electron.fs.getPlayerImage(storedId)
            if (!mounted || !data) return null
            return URL.createObjectURL(new Blob([new Uint8Array(data)]))
        }

        const offMap = window.electron.on('player:set-map', (storedId) => {
            toDataUrl(storedId as string).then((url) => {
                if (!mounted) return
                setMapUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return url
                })
            })
        })

        const offClearMap = window.electron.on('player:clear-map', () => {
            setMapUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
        })

        const offOverlay = window.electron.on('player:show-overlay', (storedId, name) => {
            toDataUrl(storedId as string).then((url) => {
                if (!mounted || !url) return
                setOverlay((prev) => {
                    if (prev) URL.revokeObjectURL(prev.dataUrl)
                    return { dataUrl: url, name: name as string }
                })
            })
        })

        const offClearOverlay = window.electron.on('player:clear-overlay', () => {
            setOverlay((prev) => {
                if (prev) URL.revokeObjectURL(prev.dataUrl)
                return null
            })
        })

        return () => {
            mounted = false
            offMap()
            offClearMap()
            offOverlay()
            offClearOverlay()
        }
    }, [])

    return (
        <div className="w-screen h-screen bg-black overflow-hidden relative">
            {mapUrl ? (
                <img src={mapUrl} alt="" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-fear-secondary to-ui-bg" />
            )}

            {overlay && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                    <img
                        src={overlay.dataUrl}
                        alt={overlay.name}
                        className="max-w-[40vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
                    />
                </div>
            )}
        </div>
    )
}

export default PlayerScreen
