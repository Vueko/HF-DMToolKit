import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVaultStore } from '../vault/vaultStore'
import { VaultTree } from '../components/vault/VaultTree'
import { VaultMarkdown } from '../components/vault/VaultMarkdown'
import { slugifyHeading } from '../vault/slug'
import { extractFrontmatter } from '../vault/obsidianMarkdown'
import type { VaultSearchResult } from '../types'

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
        </svg>
    )
}

// Highlights the matched query substring within a piece of text.
function Highlight({ text, query }: { text: string; query: string }) {
    const q = query.trim()
    if (!q) return <>{text}</>
    const i = text.toLowerCase().indexOf(q.toLowerCase())
    if (i === -1) return <>{text}</>
    return (
        <>
            {text.slice(0, i)}
            <mark className="bg-hope-gold/25 text-hope-yellow rounded-sm px-0.5">{text.slice(i, i + q.length)}</mark>
            {text.slice(i + q.length)}
        </>
    )
}

function ReloadIcon() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 11a8 8 0 1 0-1.6 4.8" />
            <path d="M20 4v5h-5" />
        </svg>
    )
}

function FolderOpenIcon() {
    return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v1" />
            <path d="M3 9h16.2a1 1 0 0 1 .98 1.2l-1.2 6a1 1 0 0 1-.98.8H5a1 1 0 0 1-.98-.8L3 9z" />
        </svg>
    )
}

function WorldWiki() {
    const { tree, status, pickVault, reload } = useVaultStore()
    const [searchParams] = useSearchParams()

    const [history, setHistory] = useState<string[]>([])
    const [cursor, setCursor] = useState(-1)
    const [body, setBody] = useState<string>('')
    const [frontmatter, setFrontmatter] = useState<Record<string, unknown> | null>(null)
    const [showFrontmatter, setShowFrontmatter] = useState(false)
    const [pendingHeading, setPendingHeading] = useState<string | null>(null)

    const activePath = cursor >= 0 ? history[cursor] : null

    const cursorRef = useRef(cursor)
    useEffect(() => { cursorRef.current = cursor }, [cursor])

    const openNote = useCallback((notePath: string, heading: string | null) => {
        setPendingHeading(heading)
        setHistory((prev) => {
            const trimmed = prev.slice(0, cursorRef.current + 1)
            const next = [...trimmed, notePath]
            setCursor(next.length - 1)
            return next
        })
    }, [])

    // Deep-link inicial via ?note=
    const deepLinked = useRef(false)
    useEffect(() => {
        if (deepLinked.current) return
        const note = searchParams.get('note')
        if (note) {
            deepLinked.current = true
            // Intentional: open the deep-linked note when arriving with ?note= (mount or param change).
            // eslint-disable-next-line react-hooks/set-state-in-effect
            openNote(note, null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Cargar el cuerpo de la nota activa
    useEffect(() => {
        // activePath is only null before the first note opens (cursor never returns to -1
        // afterwards), so the initial empty body/frontmatter state already covers this case.
        if (!activePath) return
        let cancelled = false
        window.electron.vault.readFile(activePath).then((raw) => {
            if (cancelled) return
            if (raw == null) { setBody('> No se pudo leer la nota.'); setFrontmatter(null); return }
            const { frontmatter, body } = extractFrontmatter(raw)
            setFrontmatter(frontmatter)
            setBody(body)
        })
        return () => { cancelled = true }
    }, [activePath])

    // Vault search (name + content), debounced. Fires the IPC in main.
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<VaultSearchResult[]>([])
    const isSearching = query.trim().length >= 2

    useEffect(() => {
        const q = query.trim()
        let cancelled = false
        const t = setTimeout(() => {
            if (q.length < 2) {
                if (!cancelled) setResults([])
                return
            }
            window.electron.vault.search(q).then((r) => {
                if (!cancelled) setResults(r)
            })
        }, 200)
        return () => { cancelled = true; clearTimeout(t) }
    }, [query])

    // Scroll al encabezado tras render
    useEffect(() => {
        if (!pendingHeading || !body) return
        const id = slugifyHeading(pendingHeading)
        const t = setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
            setPendingHeading(null)
        }, 50)
        return () => clearTimeout(t)
    }, [pendingHeading, body])

    const canBack = cursor > 0
    const canForward = cursor >= 0 && cursor < history.length - 1

    if (status === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-ui-muted text-sm">Cargando vault…</p>
            </div>
        )
    }

    if (status === 'empty' || status === 'error') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2 flex flex-col gap-3">
                    <h2 className="text-xl text-ui-text font-display">World Wiki</h2>
                    <p className="text-ui-muted text-sm">
                        {status === 'error' ? 'No se pudo abrir el vault guardado. Selecciónalo de nuevo.' : 'Selecciona la carpeta de tu vault de Obsidian.'}
                    </p>
                    <button onClick={pickVault} className="px-4 py-2 bg-hope-primary text-white rounded-lg hover:bg-hope-gold transition-colors text-sm font-medium">
                        Seleccionar vault…
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full w-full max-w-[1400px] mx-auto overflow-hidden bg-ui-surface rounded-xl border border-ui-surface2 my-4">
            <div className="w-80 border-r border-ui-surface2 flex flex-col bg-ui-bg/50 shrink-0">
                <div className="px-4 py-3 border-b border-ui-surface2 flex justify-between items-center bg-ui-surface shrink-0">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ui-muted">Vault</span>
                        <h2 className="font-display font-semibold text-ui-text leading-tight">World Wiki</h2>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => reload()} title="Recargar vault" className="p-1.5 rounded-md text-ui-muted hover:text-hope-gold hover:bg-ui-surface2/60 transition-colors">
                            <ReloadIcon />
                        </button>
                        <button onClick={pickVault} title="Cambiar vault" className="p-1.5 rounded-md text-ui-muted hover:text-hope-gold hover:bg-ui-surface2/60 transition-colors">
                            <FolderOpenIcon />
                        </button>
                    </div>
                </div>
                <div className="px-3 py-2.5 border-b border-ui-surface2/70 shrink-0">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ui-muted pointer-events-none">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar en el vault…"
                            className="w-full bg-ui-bg border border-ui-surface2 rounded-lg pl-8 pr-7 py-1.5 text-xs text-ui-text placeholder:text-ui-muted/70 focus:border-hope-gold outline-none transition-colors"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                title="Limpiar"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-ui-muted hover:text-ui-text text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    {isSearching ? (
                        results.length === 0 ? (
                            <p className="text-ui-muted text-xs italic px-1 py-2">Sin resultados para “{query.trim()}”.</p>
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-ui-muted px-1 mb-1">
                                    {results.length} resultado{results.length !== 1 ? 's' : ''}
                                </p>
                                {results.map((r) => {
                                    const isActive = activePath === r.path
                                    const folder = r.path.includes('/') ? r.path.slice(0, r.path.lastIndexOf('/')) : ''
                                    return (
                                        <button
                                            key={r.path}
                                            type="button"
                                            onClick={() => openNote(r.path, null)}
                                            className={`group w-full text-left px-2.5 py-2 rounded-md transition-colors outline-none focus-visible:ring-1 focus-visible:ring-hope-gold/40 ${isActive ? 'bg-hope-gold/10' : 'hover:bg-ui-surface2/50'}`}
                                        >
                                            <div className={`text-sm truncate ${isActive ? 'text-hope-gold font-medium' : 'text-ui-text'}`}>
                                                <Highlight text={r.name} query={query} />
                                            </div>
                                            {folder && <div className="text-[10px] text-ui-muted/70 truncate">{folder}</div>}
                                            {r.snippet && (
                                                <div className="text-[11px] text-ui-muted truncate mt-0.5">
                                                    <Highlight text={r.snippet} query={query} />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )
                    ) : (
                        tree && <VaultTree node={tree} activePath={activePath} onSelect={(p) => openNote(p, null)} />
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-ui-surface">
                <div className="p-3 border-b border-ui-surface2 flex items-center gap-2 shrink-0">
                    <button disabled={!canBack} onClick={() => setCursor((c) => c - 1)} className="px-2 py-1 text-sm rounded disabled:opacity-30 hover:bg-ui-surface2">&#x2190;</button>
                    <button disabled={!canForward} onClick={() => setCursor((c) => c + 1)} className="px-2 py-1 text-sm rounded disabled:opacity-30 hover:bg-ui-surface2">&#x2192;</button>
                    <span className="text-xs text-ui-muted truncate">{activePath ?? 'Selecciona una nota'}</span>
                    {frontmatter && (
                        <button onClick={() => setShowFrontmatter((v) => !v)} className="ml-auto text-[10px] text-ui-muted hover:text-ui-text uppercase tracking-wider">
                            {showFrontmatter ? 'Ocultar props' : 'Props'}
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-6 prose max-w-none">
                    {showFrontmatter && frontmatter && (
                        <pre className="text-xs bg-ui-bg border border-ui-surface2 rounded-lg p-3 mb-4 overflow-x-auto">{JSON.stringify(frontmatter, null, 2)}</pre>
                    )}
                    {activePath ? (
                        <VaultMarkdown body={body} onNavigate={openNote} />
                    ) : (
                        <p className="text-ui-muted text-sm italic">Selecciona una nota del vault.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default WorldWiki
