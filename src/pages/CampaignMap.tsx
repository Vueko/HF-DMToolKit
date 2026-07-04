import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampaignStore } from '../store/campaignStore'
import type { MapMarker } from '../types'
import { useVaultStore } from '../vault/vaultStore'
import type { NoteRef } from '../vault/wikilinks'
import { saveMapImage, getMapImage } from '../utils/mapDb'
import { MapIcon } from '../components/icons'


const ZOOM_SPEED = 0.1
const MIN_SCALE = 0.2
const MAX_SCALE = 5

type MapMode = 'pan' | 'path' | 'marker'


interface NoteSearchProps {
    notes: NoteRef[]
    onSelect: (note: NoteRef) => void
    placeholder?: string
}

function NoteSearch({ notes, onSelect, placeholder = 'Buscar nota…' }: NoteSearchProps) {
    const [query, setQuery] = useState('')
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return notes
        return notes.filter((n) => n.name.toLowerCase().includes(q))
    }, [notes, query])

    return (
        <div className="flex flex-col gap-2">
            <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="bg-ui-bg text-ui-text text-xs p-2 rounded-lg border border-ui-surface2 focus:border-fear-light outline-none w-full"
            />
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                    <p className="text-ui-muted text-xs italic py-2">Sin resultados.</p>
                ) : filtered.map((note) => (
                    <button
                        key={note.path}
                        onClick={() => onSelect(note)}
                        className="text-left px-3 py-2 text-xs bg-ui-surface2 hover:bg-ui-bg text-ui-text rounded-lg border border-ui-surface2 transition-colors"
                    >
                        {note.name}
                    </button>
                ))}
            </div>
        </div>
    )
}


function CampaignMap() {
    const { campaigns, currentCampaignId, updateCampaignMap } = useCampaignStore()
    const navigate = useNavigate()
    const notes = useVaultStore((s) => s.notes)

    const currentCampaign = useMemo(
        () => campaigns.find(c => c.id === currentCampaignId),
        [campaigns, currentCampaignId]
    )
    const mapData = currentCampaign?.map

    const [mode, setMode] = useState<MapMode>('pan')
    const [scale, setScale] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null)
    const [pendingName, setPendingName] = useState('')
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
    const [linkingMode, setLinkingMode] = useState(false)

    const [mapUrl, setMapUrl] = useState<string | null>(null)
    const mapUrlRef = useRef<string | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        return () => {
            if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
        }
    }, [])

    useEffect(() => {
        if (!currentCampaignId) return
        let cancelled = false

        const load = async () => {
            const url = await getMapImage('shared-map')
            if (cancelled || !url) return
            if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
            mapUrlRef.current = url
            setMapUrl(url)
            if (!mapData?.image) {
                updateCampaignMap(currentCampaignId, { image: 'indexeddb' })
            }
        }
        load()

        return () => { cancelled = true }

    }, [currentCampaignId, mapData?.image, updateCampaignMap])

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !currentCampaignId) return

        if (!file.type.startsWith('image/')) return

        await saveMapImage('shared-map', file)
        const url = URL.createObjectURL(file)

        if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
        mapUrlRef.current = url
        setMapUrl(url)
        updateCampaignMap(currentCampaignId, { image: 'indexeddb' })
    }, [currentCampaignId, updateCampaignMap])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!mapUrl) return
        e.preventDefault()
        const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE)
        setScale(newScale)
        setOffset({
            x: mouseX - ((mouseX - offset.x) / scale) * newScale,
            y: mouseY - ((mouseY - offset.y) / scale) * newScale,
        })
    }, [mapUrl, scale, offset])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (mode === 'pan' || e.button === 1) {
            setIsDragging(true)
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
        }
    }, [mode, offset])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }, [isDragging, dragStart])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleMapClick = useCallback((e: React.MouseEvent) => {
        if (!mapUrl || !currentCampaignId || isDragging) return
        const rect = mapRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        if (mode === 'path') {
            updateCampaignMap(currentCampaignId, {
                path: [...(mapData?.path ?? []), { x, y }],
            })
        } else if (mode === 'marker') {
            setSelectedMarker(null)
            setPendingName('')
            setPendingPos({ x, y })
        }
    }, [mapUrl, currentCampaignId, isDragging, mode, mapData, updateCampaignMap])

    const commitMarker = useCallback((note?: NoteRef) => {
        if (!pendingPos || !currentCampaignId) return
        const label = pendingName.trim() || note?.name || 'New Marker'
        const newMarker: MapMarker = {
            id: crypto.randomUUID(),
            x: pendingPos.x,
            y: pendingPos.y,
            label,
            noteRef: note?.path,
        }
        updateCampaignMap(currentCampaignId, {
            markers: [...(mapData?.markers ?? []), newMarker],
        })
        setPendingPos(null)
        setPendingName('')
    }, [pendingPos, pendingName, currentCampaignId, mapData, updateCampaignMap])

    const linkMarker = useCallback((markerId: string, note: NoteRef) => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            markers: (mapData?.markers ?? []).map((m) =>
                m.id === markerId ? { ...m, noteRef: note.path } : m
            ),
        })
        setLinkingMode(false)
        setSelectedMarker((prev) => prev?.id === markerId ? { ...prev, noteRef: note.path } : prev)
    }, [currentCampaignId, mapData, updateCampaignMap])

    const unlinkMarker = useCallback((markerId: string) => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            markers: (mapData?.markers ?? []).map((m) =>
                m.id === markerId ? { ...m, noteRef: undefined } : m
            ),
        })
        setSelectedMarker((prev) => prev?.id === markerId ? { ...prev, noteRef: undefined } : prev)
    }, [currentCampaignId, mapData, updateCampaignMap])

    const removeMarker = useCallback((id: string) => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            markers: (mapData?.markers ?? []).filter(m => m.id !== id),
        })
        setSelectedMarker(null)
    }, [currentCampaignId, mapData, updateCampaignMap])

    const undoPathPoint = useCallback(() => {
        if (!currentCampaignId || !mapData?.path?.length) return
        updateCampaignMap(currentCampaignId, { path: mapData.path.slice(0, -1) })
    }, [currentCampaignId, mapData, updateCampaignMap])

    const clearPath = useCallback(() => {
        if (!currentCampaignId) return
        if (!window.confirm('Clear all journey points?')) return
        updateCampaignMap(currentCampaignId, { path: [] })
    }, [currentCampaignId, updateCampaignMap])

    const linkedNoteName = useMemo(() => {
        if (!selectedMarker?.noteRef) return null
        const ref = selectedMarker.noteRef
        return notes.find((n) => n.path === ref)?.name ?? ref
    }, [selectedMarker, notes])

    const MODE_LABELS: Record<MapMode, string> = {
        pan: 'Drag to pan · Scroll to zoom',
        path: "Click on the map to add a point to your party's travel path",
        marker: 'Click on the map to drop a pin',
    }

    if (!currentCampaignId) {
        return (
            <div className="flex items-center justify-center h-full text-ui-muted">
                <p>Please select a campaign first.</p>
            </div>
        )
    }

    const hasPanelOpen = pendingPos !== null || selectedMarker !== null

    return (
        <div className="flex flex-col h-full gap-4">

            <div className="flex items-center justify-between bg-ui-surface p-4 rounded-xl border border-ui-surface2">
                <div className="flex items-center gap-6">
                    <h1 className="text-ui-text font-display font-bold text-lg">World Map</h1>
                    <div className="flex bg-ui-bg p-1 rounded-lg border border-ui-surface2">
                        {(['pan', 'path', 'marker'] as MapMode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${mode === m ? 'bg-fear-light text-ui-text' : 'text-ui-muted hover:text-ui-text'}`}
                            >
                                {m === 'pan' ? 'Pan' : m === 'path' ? 'Path' : 'Pin'}
                            </button>
                        ))}
                    </div>

                    <span className="text-xs text-ui-muted italic hidden md:block">
                        {MODE_LABELS[mode]}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {mode === 'path' && (mapData?.path?.length ?? 0) > 0 && (
                        <>
                            <button onClick={undoPathPoint} className="px-3 py-1.5 text-xs bg-ui-surface2 text-ui-text rounded-lg border border-ui-surface2 hover:bg-ui-surface transition-colors">
                                Undo Point
                            </button>
                            <button onClick={clearPath} className="px-3 py-1.5 text-xs bg-red-900/10 text-red-400 border border-red-900/20 rounded-lg hover:bg-red-900/20 transition-colors">
                                Clear Path
                            </button>
                        </>
                    )}
                    <label className="px-3 py-1.5 text-xs bg-ui-surface2 text-ui-text rounded-lg border border-ui-surface2 cursor-pointer hover:bg-ui-surface transition-colors">
                        {mapUrl ? 'Change Image' : 'Upload Map'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                </div>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                <div
                    ref={containerRef}
                    className="flex-1 bg-ui-surface rounded-xl border border-ui-surface2 overflow-hidden relative select-none"
                    style={{ cursor: mode === 'pan' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {!mapUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-ui-muted gap-4">
                            <div className="w-16 h-16 rounded-full bg-ui-surface2 flex items-center justify-center"><MapIcon className="w-8 h-8 text-ui-muted" /></div>
                            <p className="text-sm">No map image uploaded yet.</p>
                            <label className="px-6 py-2 bg-fear-light text-ui-text rounded-lg cursor-pointer hover:bg-fear-secondary transition-colors font-semibold text-sm">
                                Upload Map
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    ) : (
                        <div
                            ref={mapRef}
                            style={{
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                                transformOrigin: '0 0',
                                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                            }}
                            onClick={handleMapClick}
                            className="relative inline-block"
                        >
                            <img
                                src={mapUrl}
                                alt="Campaign World Map"
                                className="max-w-none block pointer-events-none"
                                draggable={false}
                            />

                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                {(mapData?.path?.length ?? 0) > 1 && (
                                    <polyline
                                        points={mapData!.path.map(p => `${p.x}%,${p.y}%`).join(' ')}
                                        fill="none"
                                        stroke="#facc15"
                                        strokeWidth={3 / scale}
                                        strokeDasharray={`${8 / scale},${8 / scale}`}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}
                                {mapData?.path?.map((p, i) => (
                                    <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r={3 / scale} fill="#facc15" />
                                ))}
                            </svg>

                            {mapData?.markers?.map(marker => (
                                <div
                                    key={marker.id}
                                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                                    onClick={e => { e.stopPropagation(); setPendingPos(null); setLinkingMode(false); setSelectedMarker(marker) }}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                >
                                    <div className="w-4 h-4 rounded-full bg-hope-primary border-2 border-ui-text shadow-lg group-hover:scale-125 transition-transform duration-150">
                                        <div className="absolute inset-0 rounded-full animate-ping bg-hope-primary/30 group-hover:hidden" />
                                    </div>
                                    <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
                                        <div className="bg-ui-surface border border-ui-surface2 text-ui-text text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-xl">
                                            {marker.label}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }}
                        title="Reset view"
                        className="absolute bottom-3 right-3 p-2 bg-ui-surface rounded-lg border border-ui-surface2 text-ui-muted hover:text-ui-text transition-colors text-sm shadow"
                    >
                        ⌂
                    </button>
                </div>

                {hasPanelOpen && (
                    <div className="w-80 shrink-0 bg-ui-surface rounded-xl border border-ui-surface2 p-5 flex flex-col gap-4 overflow-y-auto shadow-xl">

                        {pendingPos && (
                            <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-ui-text font-bold">New Pin</h3>
                                    <button onClick={() => setPendingPos(null)} className="text-ui-muted hover:text-ui-text">✕</button>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-ui-muted text-xs uppercase font-bold tracking-wider">Name</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={pendingName}
                                        onChange={e => setPendingName(e.target.value)}
                                        placeholder="e.g. Thornwall City"
                                        maxLength={80}
                                        className="bg-ui-bg text-ui-text text-sm p-2 rounded-lg border border-ui-surface2 focus:border-fear-light outline-none"
                                        onKeyDown={e => { if (e.key === 'Enter') commitMarker() }}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-ui-muted text-xs uppercase font-bold tracking-wider">Enlazar a nota del vault</label>
                                    {notes.length === 0 ? (
                                        <p className="text-ui-muted text-xs italic">No hay notas en el vault.</p>
                                    ) : (
                                        <NoteSearch notes={notes} placeholder="Buscar nota…" onSelect={(note) => commitMarker(note)} />
                                    )}
                                </div>

                                <button
                                    onClick={() => commitMarker()}
                                    className="mt-auto py-2 text-sm font-semibold bg-fear-light hover:bg-fear-secondary text-ui-text rounded-lg transition-colors"
                                >
                                    Place Pin (no link)
                                </button>
                            </>
                        )}

                        {selectedMarker && (
                            <>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-ui-text font-bold text-base truncate pr-2">{selectedMarker.label}</h3>
                                    <button onClick={() => { setSelectedMarker(null); setLinkingMode(false) }} className="text-ui-muted hover:text-ui-text shrink-0">✕</button>
                                </div>

                                {linkedNoteName && !linkingMode ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-black bg-fear-light px-2 py-0.5 rounded text-ui-text">Nota</span>
                                            <span className="text-sm text-ui-text truncate">{linkedNoteName}</span>
                                            <button onClick={() => unlinkMarker(selectedMarker.id)} className="ml-auto text-[10px] text-red-400 hover:underline">Desenlazar</button>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/journal?note=${encodeURIComponent(selectedMarker.noteRef!)}`)}
                                            className="py-2 text-xs font-semibold bg-hope-primary hover:bg-hope-gold text-white rounded-lg transition-colors"
                                        >
                                            Abrir en World Wiki
                                        </button>
                                    </div>
                                ) : linkingMode ? (
                                    <>
                                        <p className="text-ui-muted text-xs">Selecciona una nota para enlazar:</p>
                                        <NoteSearch notes={notes} placeholder="Buscar nota…" onSelect={(note) => linkMarker(selectedMarker.id, note)} />
                                        <button onClick={() => setLinkingMode(false)} className="text-xs text-ui-muted hover:text-ui-text underline">Cancelar</button>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-ui-muted text-xs italic">Sin nota enlazada.</p>
                                        <button onClick={() => setLinkingMode(true)} className="py-2 text-xs font-semibold bg-ui-surface2 hover:bg-ui-bg text-ui-text rounded-lg border border-ui-surface2 transition-colors">
                                            Enlazar a nota
                                        </button>
                                    </div>
                                )}

                                <div className="mt-auto pt-4 border-t border-ui-surface2">
                                    <button
                                        onClick={() => removeMarker(selectedMarker.id)}
                                        className="w-full py-2 text-xs text-red-400 bg-red-900/10 hover:bg-red-900/20 rounded-lg border border-red-900/20 transition-colors"
                                    >
                                        Delete Marker
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CampaignMap
