import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    theme?: 'fear' | 'hope'
}

const THEME: Record<NonNullable<TextareaProps['theme']>, string> = {
    fear: 'focus:border-fear-light',
    hope: 'focus:border-hope-primary',
}

export function Textarea({ theme = 'fear', className = '', ...props }: TextareaProps) {
    return (
        <textarea
            {...props}
            className={`bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none transition-colors placeholder:text-ui-muted resize-none w-full ${THEME[theme]} ${className}`}
        />
    )
}
