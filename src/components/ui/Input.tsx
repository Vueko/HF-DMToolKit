import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    theme?: 'fear' | 'hope'
}

const THEME: Record<NonNullable<InputProps['theme']>, string> = {
    fear: 'focus:border-fear-light',
    hope: 'focus:border-hope-primary',
}

export function Input({ theme = 'fear', className = '', ...props }: InputProps) {
    return (
        <input
            {...props}
            className={`bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none transition-colors placeholder:text-ui-muted w-full ${THEME[theme]} ${className}`}
        />
    )
}
