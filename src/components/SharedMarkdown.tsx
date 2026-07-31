import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router'
import { useVaultStore } from '../vault/vaultStore'
import { parseWikiTarget } from '../vault/wikilinks'
import { LinkIcon } from './icons'

interface SharedMarkdownProps {
    children: string
}

export function SharedMarkdown({ children }: SharedMarkdownProps) {
    const navigate = useNavigate()
    const resolve = useVaultStore((s) => s.resolve)
    const noteIndex = useVaultStore((s) => s.noteIndex)

    const processedText = useMemo(() => {
        if (!children) return ''
        return children.replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
            const { name, alias } = parseWikiTarget(inner)
            const path = resolve(name)
            if (path) return `[${alias || name}](/journal?note=${encodeURIComponent(path)})`
            return alias || name
        })
    // noteIndex en deps para recomputar cuando carga el vault
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children, resolve, noteIndex])

    return (
        <ReactMarkdown
            components={{
                a: ({ href, children }) => {
                    if (href?.startsWith('/journal?note=')) {
                        return (
                            <a
                                href={href}
                                onClick={(e) => { e.preventDefault(); navigate(href) }}
                                className="text-hope-gold hover:text-hope-primary font-semibold cursor-pointer transition-colors bg-hope-primary/10 px-1 rounded inline-flex items-center gap-1"
                                title="Abrir en World Wiki"
                            >
                                <LinkIcon className="w-3 h-3" />{children}
                            </a>
                        )
                    }
                    const isSafe = href?.startsWith('https://') || href?.startsWith('http://')
                    if (!isSafe) return <span className="text-hope-primary underline">{children}</span>
                    return <a href={href} target="_blank" rel="noreferrer" className="text-hope-primary hover:text-hope-gold underline">{children}</a>
                },
            }}
        >
            {processedText}
        </ReactMarkdown>
    )
}
