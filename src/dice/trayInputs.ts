import { parseNotation } from './roll'

export type TrayRollInput =
    | { kind: 'd20'; modifier: number }
    | { kind: 'notation'; notation: string }

export function parseTrayRollInput(value: string): TrayRollInput | null {
    const text = value.trim()
    if (!text) return { kind: 'd20', modifier: 0 }

    if (/^[+-]?\d+$/.test(text)) {
        return { kind: 'd20', modifier: Number.parseInt(text, 10) }
    }

    if (parseNotation(text)) {
        return { kind: 'notation', notation: text }
    }

    return null
}