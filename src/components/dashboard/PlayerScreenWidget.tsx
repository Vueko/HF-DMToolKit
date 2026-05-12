import { useState, useEffect, useRef } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { generateId } from '../../utils/generateId'
import type { PlayerScreenImage } from '../../types'

function PlayerScreenWidget() {
    const {
        campaigns,
        currentCampaignId,
        addPlayerScreenImage,
        removePlayerScreenImage,
        setActiveMap,
    } = useCampaignStore()

    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const images = campaign?.playerScreenImages ?? []

    const [isOpen, setIsOpen] = useState(false)
    const [mapDataUrl, setMapDataUrl] = useState<string | null>(null)
    const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const mapFileRef = useRef<HTMLInputElement>(null)
    const imageFileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const off = window.electron.on('player:closed', () => {
            setIsOpen(false)
            setActiveOverlayId(null)
        })
        return () => off()
    }, [])

    useEffect(() => {
        window.electron.player.isOpen().then(setIsOpen)
    }, [])

    useEffect(() => {
        const storedId = campaign?.activeMapStoredId
        if (!storedId) {
            setMapDataUrl(null)
            return
        }
        let url: string | null = null
        let mounted = true
        window.electron.fs.getPlayerImage(storedId).then((data) => {
            if (!mounted || !data) return
            url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
            setMapDataUrl(url)
        })
        return () => {
            mounted = false
            if (url) URL.revokeObjectURL(url)
        }
    }, [campaign?.activeMapStoredId])

    const handleOpenWindow = () => {
        window.electron.player.open()
        setIsOpen(true)
        if (campaign?.activeMapStoredId) {
            window.electron.player.setMap(campaign.activeMapStoredId)
        }
    }

    const handleCloseWindow = () => {
        window.electron.player.close()
        setIsOpen(false)
        setActiveOverlayId(null)
    }

    const handleMapFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !currentCampaignId) return
        setSaving(true)
        try {
            const buffer = await file.arrayBuffer()
            const storedId = generateId()
            const oldStoredId = campaign?.activeMapStoredId
            await window.electron.fs.savePlayerImage(storedId, buffer)
            if (oldStoredId) await window.electron.fs.deletePlayerImage(oldStoredId)
            setActiveMap(currentCampaignId, storedId)
            if (isOpen) window.electron.player.setMap(storedId)
        } finally {
            setSaving(false)
        }
    }

    const handleClearMap = async () => {
        if (!currentCampaignId) return
        setSaving(true)
        try {
            if (campaign?.activeMapStoredId) {
                await window.electron.fs.deletePlayerImage(campaign.activeMapStoredId)
            }
            setActiveMap(currentCampaignId, null)
            if (isOpen) window.electron.player.clearMap()
        } finally {
            setSaving(false)
        }
    }

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !currentCampaignId) return
        setSaving(true)
        try {
            const buffer = await file.arrayBuffer()
            const storedId = generateId()
            const name = file.name.replace(/\.[^.]+$/, '')
            await window.electron.fs.savePlayerImage(storedId, buffer)
            const image: PlayerScreenImage = { id: generateId(), name, storedId }
            addPlayerScreenImage(currentCampaignId, image)
        } finally {
            setSaving(false)
        }
    }

    const handleShowOverlay = (image: PlayerScreenImage) => {
        window.electron.player.showOverlay(image.storedId, image.name)
        setActiveOverlayId(image.id)
    }

    const handleClearOverlay = () => {
        window.electron.player.clearOverlay()
        setActiveOverlayId(null)
    }

    const handleRemoveImage = async (image: PlayerScreenImage) => {
        if (!currentCampaignId) return
        if (activeOverlayId === image.id) {
            window.electron.player.clearOverlay()
            setActiveOverlayId(null)
        }
        await window.electron.fs.deletePlayerImage(image.storedId)
        removePlayerScreenImage(currentCampaignId, image.id)
    }

    if (!currentCampaignId) return null

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 overflow-hidden">
            <input
                ref={mapFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMapFileChange}
            />
            <input
                ref={imageFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
            />

            <div className="flex items-center justify-between px-4 py-3 border-b border-ui-surface2/40">
                <div className="flex items-center gap-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">Player Screen</p>
                    {isOpen && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                            <span className="text-[10px] text-ui-muted">Window open</span>
                        </div>
                    )}
                </div>
                {isOpen ? (
                    <button
                        onClick={handleCloseWindow}
                        className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-2 py-1 rounded-lg transition-colors text-xs"
                    >
                        Close Window
                    </button>
                ) : (
                    <button
                        onClick={handleOpenWindow}
                        className="bg-fear-light hover:bg-fear-secondary text-ui-canvas px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                    >
                        Open Window
                    </button>
                )}
            </div>

            <div className="p-4 flex flex-col gap-4">
                <div className="flex gap-3 items-start">
                    {mapDataUrl ? (
                        <img
                            src={mapDataUrl}
                            alt="Map"
                            className="w-24 h-16 rounded-lg object-cover flex-shrink-0 border border-ui-surface2/60"
                        />
                    ) : (
                        <div className="w-24 h-16 rounded-lg border border-dashed border-ui-surface2 flex items-center justify-center flex-shrink-0">
                            <span className="text-ui-muted text-[10px]">No map</span>
                        </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-ui-muted/60">Map Canvas</p>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => mapFileRef.current?.click()}
                                disabled={saving}
                                className="bg-ui-surface2 border border-ui-surface2 text-ui-text text-xs px-3 py-1.5 rounded-lg hover:border-fear-light/50 transition-colors disabled:opacity-50"
                            >
                                {campaign?.activeMapStoredId ? 'Change Map' : 'Set Map'}
                            </button>
                            {campaign?.activeMapStoredId && (
                                <button
                                    onClick={handleClearMap}
                                    className="text-red-400 hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors text-[10px]"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-ui-muted/60">Image Library</p>
                        <button
                            onClick={() => imageFileRef.current?.click()}
                            disabled={saving}
                            className="bg-ui-surface2 border border-ui-surface2 text-ui-text text-xs px-3 py-1.5 rounded-lg hover:border-fear-light/50 transition-colors disabled:opacity-50"
                        >
                            + Import
                        </button>
                    </div>
                    {images.length === 0 ? (
                        <p className="text-ui-muted text-xs italic text-center py-2">
                            No images — import one.
                        </p>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                            {images.map((image) => (
                                <ImageCard
                                    key={image.id}
                                    image={image}
                                    isActive={activeOverlayId === image.id}
                                    canShow={isOpen}
                                    onShow={() => handleShowOverlay(image)}
                                    onRemove={() => handleRemoveImage(image)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {activeOverlayId && (
                    <div className="flex items-center justify-between bg-fear-light/10 border border-fear-light/20 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-fear-light shadow-[0_0_6px_rgba(104,79,168,0.5)]" />
                            <p className="text-xs text-fear-light">
                                Showing:{' '}
                                <span className="font-semibold">
                                    {images.find((i) => i.id === activeOverlayId)?.name}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={handleClearOverlay}
                            className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-2 py-1 rounded-lg transition-colors text-[10px]"
                        >
                            Clear overlay
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

interface ImageCardProps {
    image: PlayerScreenImage
    isActive: boolean
    canShow: boolean
    onShow: () => void
    onRemove: () => void
}

function ImageCard({ image, isActive, canShow, onShow, onRemove }: ImageCardProps) {
    const [dataUrl, setDataUrl] = useState<string | null>(null)

    useEffect(() => {
        let url: string | null = null
        let mounted = true
        window.electron.fs.getPlayerImage(image.storedId).then((data) => {
            if (!mounted || !data) return
            url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
            setDataUrl(url)
        })
        return () => {
            mounted = false
            if (url) URL.revokeObjectURL(url)
        }
    }, [image.storedId])

    return (
        <div className="group bg-ui-surface2/60 rounded-lg overflow-hidden border border-ui-surface2/60 relative">
            <div className="h-14 bg-gradient-to-br from-fear-secondary/40 to-fear-light/20 overflow-hidden">
                {dataUrl && (
                    <img src={dataUrl} alt={image.name} className="w-full h-full object-cover" />
                )}
            </div>
            <div className="p-1.5 flex flex-col gap-1">
                <p className="text-[10px] font-medium text-ui-muted truncate">{image.name}</p>
                <button
                    onClick={canShow ? onShow : undefined}
                    disabled={!canShow}
                    className={`w-full text-[9px] font-bold py-0.5 rounded transition-colors uppercase tracking-wide ${
                        isActive
                            ? 'bg-fear-light/40 text-fear-light cursor-default'
                            : canShow
                              ? 'bg-fear-light/15 text-fear-light/70 hover:bg-fear-light/30'
                              : 'bg-ui-surface2/40 text-ui-muted/40 cursor-not-allowed'
                    }`}
                >
                    {isActive ? 'Showing' : 'Show'}
                </button>
            </div>
            <button
                onClick={onRemove}
                className="absolute top-1 right-1 w-5 h-5 rounded flex items-center justify-center bg-black/50 text-white/60 hover:text-white hover:bg-red-900/60 transition-colors opacity-0 group-hover:opacity-100 text-[10px]"
            >
                ✕
            </button>
        </div>
    )
}

export default PlayerScreenWidget
