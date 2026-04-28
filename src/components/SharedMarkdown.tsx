import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import { useCampaignStore } from '../store/campaignStore'

interface SharedMarkdownProps {
    children: string
}

export function SharedMarkdown({ children }: SharedMarkdownProps) {
    const navigate = useNavigate()
    const { campaigns, currentCampaignId } = useCampaignStore()

    const processedText = useMemo(() => {
        if (!children) return ''
        const currentCampaign = campaigns.find(c => c.id === currentCampaignId)
        if (!currentCampaign || !currentCampaign.lore) return children

        return children.replace(/\[\[(.*?)\]\]/g, (match, title) => {
            const loreEntry = currentCampaign.lore.find(l => l.title.toLowerCase() === title.trim().toLowerCase())
            if (loreEntry) {
                return `[${title}](/journal?entryId=${loreEntry.id})`
            }
            return match
        })
    }, [children, campaigns, currentCampaignId])

    return (
        <ReactMarkdown
            components={{
                a: ({ node, href, children, ...props }) => {
                    if (href?.startsWith('/journal?entryId=')) {
                        return (
                            <a
                                href={href}
                                onClick={(e) => {
                                    e.preventDefault()
                                    navigate(href)
                                }}
                                className="text-hope-gold hover:text-hope-primary font-semibold cursor-pointer transition-colors bg-hope-primary/10 px-1 rounded inline-flex items-center gap-1"
                                title="Open in World Wiki"
                            >
                                <span className="text-[10px]">🔗</span>{children}
                            </a>
                        )
                    }
                    return <a href={href} target="_blank" rel="noreferrer" className="text-hope-primary hover:text-hope-gold underline" {...props}>{children}</a>
                }
            }}
        >
            {processedText}
        </ReactMarkdown>
    )
}
