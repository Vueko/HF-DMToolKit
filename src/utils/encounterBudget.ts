import type { EncounterAdjustment } from '../types'

export const ADJUSTMENT_DELTAS: Record<EncounterAdjustment, number> = {
    easy_short: -1,
    two_plus_solos: -2,
    bonus_damage: -2,
    lower_tier: 1,
    no_heavy_roles: 1,
    dangerous_long: 2,
}

export const MANUAL_ADJUSTMENTS: EncounterAdjustment[] = ['easy_short', 'dangerous_long', 'no_heavy_roles', 'bonus_damage']
export const AUTO_ADJUSTMENTS: EncounterAdjustment[] = ['two_plus_solos', 'lower_tier']

export interface RosterEntry {
    cardId: string
    count: number
}

export interface RosterCard {
    role?: string
    tier?: number
}

export function soloCount(entries: RosterEntry[], cardsById: ReadonlyMap<string, RosterCard>): number {
    return entries.reduce((sum, e) => {
        const card = cardsById.get(e.cardId)
        return card?.role === 'Solo' ? sum + e.count : sum
    }, 0)
}

export function lowerTierCount(entries: RosterEntry[], cardsById: ReadonlyMap<string, RosterCard>, encounterTier: number | undefined): number {
    if (!encounterTier) return 0
    return entries.reduce((sum, e) => {
        const card = cardsById.get(e.cardId)
        return card?.tier != null && card.tier < encounterTier ? sum + e.count : sum
    }, 0)
}

export function computeAutoAdjustments(entries: RosterEntry[], cardsById: ReadonlyMap<string, RosterCard>, encounterTier: number | undefined): EncounterAdjustment[] {
    const auto: EncounterAdjustment[] = []
    if (soloCount(entries, cardsById) >= 2) auto.push('two_plus_solos')
    if (lowerTierCount(entries, cardsById, encounterTier) >= 1) auto.push('lower_tier')
    return auto
}

export function activeAdjustments(storedManual: EncounterAdjustment[], autoDetected: EncounterAdjustment[]): EncounterAdjustment[] {
    const manual = storedManual.filter((a) => MANUAL_ADJUSTMENTS.includes(a))
    return [...manual, ...autoDetected]
}

export function calcBattlePoints(pcCount: number, active: EncounterAdjustment[]): number {
    const base = 3 * pcCount + 2
    const delta = active.reduce((sum, a) => sum + (ADJUSTMENT_DELTAS[a] ?? 0), 0)
    return base + delta
}
