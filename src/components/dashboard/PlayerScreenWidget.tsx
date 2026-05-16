import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { FogZone, PlayerScreenImage } from '../../types'
import { generateId } from '../../utils/generateId'

const MAP_HEIGHT = 420

type FogInteract =
    | { kind: 'drag'; zoneId: string; startPct: { x: number; y: number }; origZone: { x: number; y: number; w: number; h: number } }
    | { kind: 'resize'; zoneId: string; startPct: { x: number; y: number }; origZone: { x: number; y: number; w: number; h: number } }

function PlayerScreenWidget() {
    const {
        campaigns, currentCampaignId, updateCampaignMap,
        addPlayerScreenImage, removePlayerScreenImage, setActiveMap,
    } = useCampaignStore()

    const campaign = useMemo(
        () => campaigns.find(c => c.id === currentCampaignId) ?? null,
        [campaigns, currentCampaignId]
    )
    const mapData = campaign?.map
    const images = campaign?.playerScreenImages ?? []

    // Window state
    const [isOpen, setIsOpen] = useState(false)
    const [displays, setDisplays] = useState<{ index: number; label: string; isPrimary: boolean }[]>([])
    const [selectedDisplay, setSelectedDisplay] = useState(0)
    const [saving, setSaving] = useState(false)
    const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null)

    // Map canvas — static auto-fit view
    const [mapUrl, setMapUrl] = useState<string | null>(null)
    const [dmScale, setDmScale] = useState(1)
    const [dmOffset, setDmOffset] = useState({ x: 0, y: 0 })

    // Fog editing
    const [fogDraft, setFogDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
    const [fogInteract, setFogInteract] = useState<FogInteract | null>(null)
    const [liveZoneOverride, setLiveZoneOverride] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)

    const mapUrlRef = useRef<string | null>(null)
    const mapFileRef = useRef<HTMLInputElement>(null)
    const imageFileRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        return () => { if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current) }
    }, [])

    useEffect(() => {
        const storedId = campaign?.activeMapStoredId ?? null
        if (!storedId) {
            if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
            mapUrlRef.current = null
            setMapUrl(null)
            return
        }
        let mounted = true
        window.electron.fs.getPlayerImage(storedId).then((data) => {
            if (!mounted || !data) return
            if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
            const url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
            mapUrlRef.current = url
            setMapUrl(url)
        })
        return () => { mounted = false }
    }, [campaign?.activeMapStoredId])

    // Auto-fit map when it loads — read-only, no interactive pan/zoom
    useEffect(() => {
        if (!mapUrl) {
            setDmScale(1)
            setDmOffset({ x: 0, y: 0 })
            return
        }
        const img = new Image()
        img.onload = () => {
            const cW = containerRef.current?.clientWidth ?? 800
            const s = Math.min(cW / img.naturalWidth, MAP_HEIGHT / img.naturalHeight, 1)
            setDmScale(s)
            setDmOffset({
                x: (cW - img.naturalWidth * s) / 2,
                y: (MAP_HEIGHT - img.naturalHeight * s) / 2,
            })
        }
        img.src = mapUrl
    }, [mapUrl])

    useEffect(() => {
        window.electron.player.getDisplays().then((d) => {
            setDisplays(d)
            const secondary = d.find(x => !x.isPrimary)
            if (secondary) setSelectedDisplay(secondary.index)
        })
    }, [])

    useEffect(() => {
        window.electron.player.isOpen().then((open) => setIsOpen(open))
    }, [])

    useEffect(() => {
        const off = window.electron.on('player:closed', () => {
            setIsOpen(false)
            setActiveOverlayId(null)
        })
        return () => off()
    }, [])

    const handleOpenWindow = useCallback(() => {
        window.electron.player.open(selectedDisplay)
        setIsOpen(true)
        if (campaign?.activeMapStoredId) {
            window.electron.player.setMap(campaign.activeMapStoredId)
        }
    }, [selectedDisplay, campaign?.activeMapStoredId])

    const handleCloseWindow = useCallback(() => {
        window.electron.player.close()
        setIsOpen(false)
        setActiveOverlayId(null)
    }, [])

    const handleMapFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, [currentCampaignId, campaign?.activeMapStoredId, isOpen, setActiveMap])

    const handleClearMap = useCallback(async () => {
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
    }, [currentCampaignId, campaign?.activeMapStoredId, isOpen, setActiveMap])

    const handleImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !currentCampaignId) return
        setSaving(true)
        try {
            const buffer = await file.arrayBuffer()
            const storedId = generateId()
            const name = file.name.replace(/\.[^.]+$/, '')
            await window.electron.fs.savePlayerImage(storedId, buffer)
            addPlayerScreenImage(currentCampaignId, { id: generateId(), name, storedId })
        } finally {
            setSaving(false)
        }
    }, [currentCampaignId, addPlayerScreenImage])

    const handleShowOverlay = useCallback((image: PlayerScreenImage) => {
        window.electron.player.showOverlay(image.storedId, image.name)
        setActiveOverlayId(image.id)
    }, [])

    const handleClearOverlay = useCallback(() => {
        window.electron.player.clearOverlay()
        setActiveOverlayId(null)
    }, [])

    const handleRemoveImage = useCallback(async (image: PlayerScreenImage) => {
        if (!currentCampaignId) return
        if (activeOverlayId === image.id) {
            window.electron.player.clearOverlay()
            setActiveOverlayId(null)
        }
        await window.electron.fs.deletePlayerImage(image.storedId)
        removePlayerScreenImage(currentCampaignId, image.id)
    }, [currentCampaignId, activeOverlayId, removePlayerScreenImage])

    // Fog helpers
    const fogZones = mapData?.fogZones ?? []
    const effectiveFogZones: FogZone[] = liveZoneOverride
        ? fogZones.map(z => z.id === liveZoneOverride.id ? { ...z, ...liveZoneOverride } : z)
        : fogZones

    const screenToImagePct = useCallback((e: React.MouseEvent) => {
        const rect = mapRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        }
    }, [])

    const startDragZone = useCallback((e: React.MouseEvent, zone: FogZone) => {
        e.stopPropagation()
        const pct = screenToImagePct(e)
        setFogInteract({ kind: 'drag', zoneId: zone.id, startPct: pct, origZone: { x: zone.x, y: zone.y, w: zone.w, h: zone.h } })
    }, [screenToImagePct])

    const startResizeZone = useCallback((e: React.MouseEvent, zone: FogZone) => {
        e.stopPropagation()
        const pct = screenToImagePct(e)
        setFogInteract({ kind: 'resize', zoneId: zone.id, startPct: pct, origZone: { x: zone.x, y: zone.y, w: zone.w, h: zone.h } })
    }, [screenToImagePct])

    const deleteZone = useCallback((id: string) => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            fogZones: (mapData?.fogZones ?? []).filter(z => z.id !== id),
        })
    }, [currentCampaignId, mapData, updateCampaignMap])

    const revealAll = useCallback(() => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            fogZones: [{ id: crypto.randomUUID(), x: 0, y: 0, w: 100, h: 100 }],
        })
    }, [currentCampaignId, updateCampaignMap])

    const clearAllFog = useCallback(() => {
        if (!currentCampaignId) return
        if (!window.confirm('Clear revealed zones? The entire map will return to fog.')) return
        updateCampaignMap(currentCampaignId, { fogZones: [] })
    }, [currentCampaignId, updateCampaignMap])

    const pushToPlayers = useCallback(() => {
        if (!campaign?.activeMapStoredId) return
        window.electron.player.setMap(campaign.activeMapStoredId)
        if (mapData?.fogZones !== undefined) {
            window.electron.player.setFog(mapData.fogZones)
        }
    }, [campaign?.activeMapStoredId, mapData?.fogZones])

    // Fog interaction — no map navigation, only zone drawing/editing
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!mapUrl || e.button !== 0 || fogInteract) return
        const pct = screenToImagePct(e)
        setFogDraft({ x0: pct.x, y0: pct.y, x1: pct.x, y1: pct.y })
        setIsDrawing(true)
    }, [mapUrl, fogInteract, screenToImagePct])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (fogInteract) {
            const pct = screenToImagePct(e)
            const dx = pct.x - fogInteract.startPct.x
            const dy = pct.y - fogInteract.startPct.y
            if (fogInteract.kind === 'drag') {
                const { origZone } = fogInteract
                setLiveZoneOverride({
                    id: fogInteract.zoneId,
                    x: Math.max(0, Math.min(100 - origZone.w, origZone.x + dx)),
                    y: Math.max(0, Math.min(100 - origZone.h, origZone.y + dy)),
                    w: origZone.w, h: origZone.h,
                })
            } else {
                const { origZone } = fogInteract
                setLiveZoneOverride({
                    id: fogInteract.zoneId,
                    x: origZone.x, y: origZone.y,
                    w: Math.max(2, origZone.w + dx),
                    h: Math.max(2, origZone.h + dy),
                })
            }
            return
        }
        if (!isDrawing || !fogDraft) return
        const pct = screenToImagePct(e)
        setFogDraft(d => d ? { ...d, x1: pct.x, y1: pct.y } : null)
    }, [fogInteract, isDrawing, fogDraft, screenToImagePct])

    const handleMouseUp = useCallback(() => {
        if (fogDraft && isDrawing && currentCampaignId) {
            const x = Math.min(fogDraft.x0, fogDraft.x1)
            const y = Math.min(fogDraft.y0, fogDraft.y1)
            const w = Math.abs(fogDraft.x1 - fogDraft.x0)
            const h = Math.abs(fogDraft.y1 - fogDraft.y0)
            if (w > 1 && h > 1) {
                updateCampaignMap(currentCampaignId, {
                    fogZones: [...(mapData?.fogZones ?? []), { id: crypto.randomUUID(), x, y, w, h }],
                })
            }
        }
        if (fogInteract && liveZoneOverride && currentCampaignId) {
            updateCampaignMap(currentCampaignId, {
                fogZones: (mapData?.fogZones ?? []).map(z =>
                    z.id === liveZoneOverride.id ? { ...z, ...liveZoneOverride } : z
                ),
            })
        }
        setFogDraft(null)
        setFogInteract(null)
        setLiveZoneOverride(null)
        setIsDrawing(false)
    }, [fogDraft, isDrawing, fogInteract, liveZoneOverride, currentCampaignId, mapData, updateCampaignMap])

    if (!currentCampaignId) return null

    const cursorStyle = fogInteract
        ? (fogInteract.kind === 'drag' ? 'move' : 'se-resize')
        : 'crosshair'

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 overflow-hidden">
            <input ref={mapFileRef} type="file" accept="image/*" className="hidden" onChange={handleMapFileChange} />
            <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />

            {/* Header */}
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
                    <button onClick={handleCloseWindow} className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-2 py-1 rounded-lg transition-colors text-xs">
                        Close Window
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        {displays.length > 1 && (
                            <select
                                value={selectedDisplay}
                                onChange={e => setSelectedDisplay(Number(e.target.value))}
                                className="bg-ui-surface2 border border-ui-surface2 text-ui-muted text-[10px] px-2 py-1 rounded-lg outline-none focus:border-fear-light/50 transition-colors"
                            >
                                {displays.map(d => (
                                    <option key={d.index} value={d.index}>
                                        {d.label}{d.isPrimary ? ' (primary)' : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                        <button onClick={handleOpenWindow} className="bg-fear-light hover:bg-fear-secondary text-ui-canvas px-3 py-1 rounded-lg transition-colors text-xs font-medium">
                            Open Window
                        </button>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-ui-surface2/40 bg-ui-bg/30">
                <span className="text-[10px] text-ui-muted italic hidden lg:block">
                    {mapUrl ? 'Drag to reveal · Click zone to move/resize/delete' : 'Set a map to start editing fog'}
                </span>
                <div className="flex items-center gap-1.5 ml-auto">
                    {mapUrl && (
                        <>
                            <button onClick={revealAll} className="px-2 py-1 text-xs bg-ui-surface2 text-ui-text rounded-lg border border-ui-surface2 hover:bg-ui-surface transition-colors">
                                Reveal All
                            </button>
                            <button onClick={clearAllFog} className="px-2 py-1 text-xs bg-red-900/10 text-red-400 border border-red-900/20 rounded-lg hover:bg-red-900/20 transition-colors">
                                Clear Fog
                            </button>
                        </>
                    )}
                    {isOpen && (
                        <button
                            onClick={pushToPlayers}
                            disabled={!mapUrl}
                            className="px-2 py-1 text-xs bg-hope-primary text-white rounded-lg hover:bg-hope-primary/80 transition-colors disabled:opacity-50"
                        >
                            Push to Players
                        </button>
                    )}
                    <div className="flex items-center gap-1 ml-1 pl-1 border-l border-ui-surface2">
                        <button
                            onClick={() => mapFileRef.current?.click()}
                            disabled={saving}
                            className="px-2 py-1 text-xs bg-ui-surface2 border border-ui-surface2 text-ui-text rounded-lg hover:border-fear-light/50 transition-colors disabled:opacity-50"
                        >
                            {campaign?.activeMapStoredId ? 'Change Map' : 'Set Map'}
                        </button>
                        {campaign?.activeMapStoredId && (
                            <button onClick={handleClearMap} className="text-red-400 hover:bg-red-900/20 px-1.5 py-1 rounded-lg transition-colors text-[10px]">
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Map canvas — static auto-fit, fog editing only */}
            <div
                ref={containerRef}
                className="relative bg-ui-bg overflow-hidden select-none"
                style={{ height: MAP_HEIGHT, cursor: mapUrl ? cursorStyle : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={e => e.preventDefault()}
            >
                {!mapUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-ui-muted gap-2">
                        <p className="text-sm">No map set.</p>
                        <button
                            onClick={() => mapFileRef.current?.click()}
                            className="text-xs bg-ui-surface2 border border-ui-surface2 text-ui-text px-3 py-1.5 rounded-lg hover:border-fear-light/50 transition-colors"
                        >
                            Set Map Canvas
                        </button>
                    </div>
                ) : (
                    <div
                        ref={mapRef}
                        style={{
                            transform: `translate(${dmOffset.x}px, ${dmOffset.y}px) scale(${dmScale})`,
                            transformOrigin: '0 0',
                        }}
                        className="relative inline-block"
                    >
                        <img src={mapUrl} alt="Player Map" className="max-w-none block pointer-events-none" draggable={false} />

                        {/* Fog overlay — always shown for editing context */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <mask id="fog-mask-widget">
                                    <rect width="100%" height="100%" fill="white" />
                                    {effectiveFogZones.map(zone => (
                                        <rect key={zone.id} x={`${zone.x}%`} y={`${zone.y}%`} width={`${zone.w}%`} height={`${zone.h}%`} fill="black" />
                                    ))}
                                </mask>
                            </defs>
                            <image href={mapUrl} width="100%" height="100%" opacity="0.5" />
                            <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#fog-mask-widget)" />
                            {fogDraft && (() => {
                                const x = Math.min(fogDraft.x0, fogDraft.x1)
                                const y = Math.min(fogDraft.y0, fogDraft.y1)
                                const w = Math.abs(fogDraft.x1 - fogDraft.x0)
                                const h = Math.abs(fogDraft.y1 - fogDraft.y0)
                                return (
                                    <rect
                                        x={`${x}%`} y={`${y}%`} width={`${w}%`} height={`${h}%`}
                                        fill="rgba(100,200,255,0.15)"
                                        stroke="rgba(100,200,255,0.8)"
                                        strokeWidth={2 / dmScale}
                                        strokeDasharray={`${6 / dmScale},${4 / dmScale}`}
                                    />
                                )
                            })()}
                        </svg>

                        {/* Zone handles */}
                        {effectiveFogZones.map(zone => (
                            <div
                                key={zone.id}
                                style={{
                                    position: 'absolute', left: `${zone.x}%`, top: `${zone.y}%`,
                                    width: `${zone.w}%`, height: `${zone.h}%`,
                                    cursor: 'move', border: '2px solid rgba(100,200,255,0.7)', boxSizing: 'border-box',
                                }}
                                onMouseDown={e => startDragZone(e, zone)}
                            >
                                <button
                                    style={{ position: 'absolute', top: -10, right: -10, width: 18, height: 18, fontSize: 10, background: 'rgba(200,50,50,0.9)', color: 'white', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                                >x</button>
                                <div
                                    style={{ position: 'absolute', bottom: -5, right: -5, width: 12, height: 12, background: 'rgba(100,200,255,0.9)', borderRadius: 2, cursor: 'se-resize' }}
                                    onMouseDown={e => startResizeZone(e, zone)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {!isOpen && mapUrl && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-ui-surface/80 rounded text-[10px] text-ui-muted border border-ui-surface2/40">
                        Open Player Window to push content
                    </div>
                )}
            </div>

            {/* Image library */}
            <div className="p-4 flex flex-col gap-3 border-t border-ui-surface2/40">
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
                    <p className="text-ui-muted text-xs italic text-center py-2">No images — import one.</p>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                        {images.map(image => (
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
                {activeOverlayId && (
                    <div className="flex items-center justify-between bg-fear-light/10 border border-fear-light/20 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-fear-light shadow-[0_0_6px_rgba(104,79,168,0.5)]" />
                            <p className="text-xs text-fear-light">
                                Showing: <span className="font-semibold">{images.find(i => i.id === activeOverlayId)?.name}</span>
                            </p>
                        </div>
                        <button onClick={handleClearOverlay} className="text-ui-muted hover:text-ui-text hover:bg-ui-surface2/40 px-2 py-1 rounded-lg transition-colors text-[10px]">
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
            <div className="h-14 bg-linear-to-br from-fear-secondary/40 to-fear-light/20 overflow-hidden">
                {dataUrl && <img src={dataUrl} alt={image.name} className="w-full h-full object-cover" />}
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
            >✕</button>
        </div>
    )
}

export default PlayerScreenWidget
