import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    theme?: 'fear' | 'hope'
}

const THEME: Record<NonNullable<SelectProps['theme']>, string> = {
    fear: 'focus:border-fear-light',
    hope: 'focus:border-hope-primary',
}

export function Select({ theme = 'fear', className = '', children, ...props }: SelectProps) {
    return (
        <select
            {...props}
            className={`bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none transition-colors w-full ${THEME[theme]} ${className}`}
        >
            {children}
        </select>
    )
}
