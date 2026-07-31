import { generateId } from '../utils/generateId'

export type RollMode = 'normal' | 'advantage' | 'disadvantage'
export type RollKind = 'notation' | 'duality' | 'd20'
export type DualityTone = 'hope' | 'fear'
export type RollOutcome = 'success' | 'failure'

export interface DiceTerm {
    count: number
    sides: number
    sign: 1 | -1
}

export interface RollSpec {
    terms: (DiceTerm | number)[]
}

export interface TermResult {
    rolls: number[]
    subtotal: number
}

export interface BaseRollResult {
    id: string
    kind: RollKind
    label?: string
    total: number
    timestamp: number
}

export interface NotationRollResult extends BaseRollResult {
    kind: 'notation'
    notation: string
    terms: TermResult[]
}

export interface DualityExtraDie {
    sides: 6
    value: number
    sign: 1 | -1
    label: 'advantage' | 'disadvantage'
}

export interface DualityRollResult extends BaseRollResult {
    kind: 'duality'
    hope: number
    fear: number
    modifier: number
    extraDice: DualityExtraDie[]
    outcomeTone: DualityTone
    critical: boolean
    difficulty?: number
    outcome?: RollOutcome
}

export interface D20RollResult extends BaseRollResult {
    kind: 'd20'
    rolls: number[]
    kept: number
    modifier: number
    mode: RollMode
    critical: boolean
}

export type RollResult = NotationRollResult | DualityRollResult | D20RollResult

const MAX_TERMS = 10
const MAX_DICE = 40
const MAX_SIDES = 1000
const TERM_RE = /^(\d*)d(\d+)$/

const rollDie = (sides: number, rng: () => number): number => Math.floor(rng() * sides) + 1

export function parseNotation(input: string): RollSpec | null {
    const compact = input.trim().toLowerCase().replace(/\s+/g, '')
    if (!compact) return null
    const normalized = /^[+-]/.test(compact) ? compact : `+${compact}`
    const parts = normalized.match(/[+-][^+-]+/g)
    if (!parts || parts.join('') !== normalized || parts.length > MAX_TERMS) return null

    const terms: RollSpec['terms'] = []
    for (const part of parts) {
        const sign = (part[0] === '-' ? -1 : 1) as 1 | -1
        const body = part.slice(1)
        if (/^\d+$/.test(body)) {
            terms.push(sign * Number.parseInt(body, 10))
            continue
        }
        const match = TERM_RE.exec(body)
        if (!match) return null
        const count = match[1] === '' ? 1 : Number.parseInt(match[1], 10)
        const sides = Number.parseInt(match[2], 10)
        if (count < 1 || count > MAX_DICE || sides < 2 || sides > MAX_SIDES) return null
        terms.push({ count, sides, sign })
    }

    return { terms }
}

export function formatSpec(spec: RollSpec): string {
    return spec.terms.map((term, index) => {
        const negative = typeof term === 'number' ? term < 0 : term.sign < 0
        const body = typeof term === 'number'
            ? String(Math.abs(term))
            : `${term.count}d${term.sides}`
        return index === 0 && !negative ? body : `${negative ? '-' : '+'}${body}`
    }).join('')
}

export function roll(spec: RollSpec, rng: () => number = Math.random): NotationRollResult {
    const terms = spec.terms.map((term): TermResult => {
        if (typeof term === 'number') return { rolls: [], subtotal: term }
        const rolls = Array.from({ length: term.count }, () => rollDie(term.sides, rng))
        return { rolls, subtotal: term.sign * rolls.reduce((sum, value) => sum + value, 0) }
    })
    return {
        id: generateId(),
        kind: 'notation',
        notation: formatSpec(spec),
        terms,
        total: terms.reduce((sum, term) => sum + term.subtotal, 0),
        timestamp: Date.now(),
    }
}

export function criticalDamageNotation(input: string): string | null {
    const spec = parseNotation(input)
    if (!spec) return null
    const maxDice = spec.terms.reduce<number>((sum, term) =>
        typeof term === 'number' ? sum : sum + term.sign * term.count * term.sides, 0)
    if (maxDice <= 0) return formatSpec(spec)
    return `${formatSpec(spec)}+${maxDice}`
}

export function rollDuality(
    options: { modifier?: number; advantage?: number; disadvantage?: number; difficulty?: number; label?: string } = {},
    rng: () => number = Math.random,
): DualityRollResult {
    const hope = rollDie(12, rng)
    const fear = rollDie(12, rng)
    const modifier = Math.trunc(options.modifier ?? 0)
    const advantage = Math.max(0, Math.trunc(options.advantage ?? 0))
    const disadvantage = Math.max(0, Math.trunc(options.disadvantage ?? 0))
    const net = advantage - disadvantage
    const extraDice: DualityExtraDie[] = Array.from({ length: Math.abs(net) }, () => {
        const sign = net > 0 ? 1 : -1
        return {
            sides: 6,
            value: rollDie(6, rng),
            sign,
            label: sign > 0 ? 'advantage' : 'disadvantage',
        }
    })
    const total = hope + fear + modifier + extraDice.reduce((sum, die) => sum + die.sign * die.value, 0)
    const critical = hope === fear
    const difficulty = options.difficulty
    return {
        id: generateId(),
        kind: 'duality',
        label: options.label,
        hope,
        fear,
        modifier,
        extraDice,
        outcomeTone: critical || hope >= fear ? 'hope' : 'fear',
        critical,
        total,
        difficulty,
        outcome: difficulty === undefined ? undefined : total >= difficulty ? 'success' : 'failure',
        timestamp: Date.now(),
    }
}

export function rollD20(
    options: { modifier?: number; mode?: RollMode; label?: string } = {},
    rng: () => number = Math.random,
): D20RollResult {
    const modifier = Math.trunc(options.modifier ?? 0)
    const mode = options.mode ?? 'normal'
    const rolls = mode === 'normal'
        ? [rollDie(20, rng)]
        : [rollDie(20, rng), rollDie(20, rng)]
    const kept = mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls[0]
    return {
        id: generateId(),
        kind: 'd20',
        label: options.label,
        rolls,
        kept,
        modifier,
        mode,
        total: kept + modifier,
        critical: kept === 20,
        timestamp: Date.now(),
    }
}

