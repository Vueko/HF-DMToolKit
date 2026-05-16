import type { ReactNode } from 'react'

interface BadgeProps {
    variant?: 'default' | 'fear' | 'hope' | 'warning' | 'danger'
    children: ReactNode
    className?: string
}

const VARIANT: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-ui-surface2 text-ui-muted',
    fear: 'bg-fear-light/15 text-fear-light',
    hope: 'bg-hope-primary/15 text-hope-primary',
    warning: 'bg-hope-yellow/15 text-hope-yellow',
    danger: 'bg-red-900/20 text-red-400',
}

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
    return (
        <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded inline-block ${VARIANT[variant]} ${className}`}>
            {children}
        </span>
    )
}
