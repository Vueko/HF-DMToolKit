import { parseNotation } from './roll'

export function parseAttackModifier(value: string | undefined): number | null {
    const text = value?.trim()
    if (!text || !/^[+-]?\d+$/.test(text)) return null
    return Number.parseInt(text, 10)
}

export function rollableDamageNotation(value: string | undefined): string | null {
    const text = value?.trim()
    if (!text) return null
    return parseNotation(text) ? text : null
}
