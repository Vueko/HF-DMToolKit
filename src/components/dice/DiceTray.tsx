import { useState } from 'react'
import { useDiceStore } from '../../store/diceStore'
import { useCampaignStore } from '../../store/campaignStore'
import type { D20RollResult, DualityRollResult, NotationRollResult, RollResult } from '../../dice/roll'
import { parseTrayRollInput } from '../../dice/trayInputs'

const FLAT_ADVANTAGE_MODIFIER = 6

function signed(value: number): string {
    return value > 0 ? `+${value}` : String(value)
}

function resultTone(result: RollResult): string {
    if (result.kind === 'duality') return result.critical ? 'Critical Hope' : result.outcomeTone === 'hope' ? 'Hope' : 'Fear'
    if (result.kind === 'd20') return result.critical ? 'Natural 20' : 'GM'
    return 'Damage'
}

function ResultSummary({ result }: { result: RollResult }) {
    return (
        <div className="flex items-center gap-3 min-w-0">
            <span className={`font-display text-2xl font-bold tabular-nums ${
                result.kind === 'duality' && result.outcomeTone === 'hope'
                    ? 'text-hope-gold'
                    : result.kind === 'duality'
                    ? 'text-fear-light'
                    : 'text-ui-text'
            }`}>
                {result.total}
            </span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ui-text truncate">{result.label ?? result.kind}</span>
                    <span className="text-[10px] uppercase tracking-wider text-ui-muted shrink-0">{resultTone(result)}</span>
                </div>
                {result.kind === 'duality' && <DualityDetail result={result} />}
                {result.kind === 'd20' && <D20Detail result={result} />}
                {result.kind === 'notation' && <NotationDetail result={result} />}
            </div>
        </div>
    )
}

function DualityDetail({ result }: { result: DualityRollResult }) {
    return (
        <p className="text-[11px] text-ui-muted truncate">
            Hope {result.hope} + Fear {result.fear}
            {result.modifier ? ` ${signed(result.modifier)}` : ''}
            {result.extraDice.map((die) => ` ${die.sign > 0 ? '+' : '-'}d6(${die.value})`).join('')}
            {result.difficulty !== undefined && result.outcome ? ` vs ${result.difficulty} - ${result.outcome}` : ''}
        </p>
    )
}

function D20Detail({ result }: { result: D20RollResult }) {
    return (
        <p className="text-[11px] text-ui-muted truncate">
            {result.mode === 'normal' ? `d20 ${result.kept}` : `${result.rolls.join(' / ')} keep ${result.kept}`}
            {result.modifier ? ` ${signed(result.modifier)}` : ''}
        </p>
    )
}

function NotationDetail({ result }: { result: NotationRollResult }) {
    return (
        <p className="text-[11px] text-ui-muted truncate">
            {result.notation} - {result.terms.map((term) => term.rolls.length ? `[${term.rolls.join(', ')}]` : signed(term.subtotal)).join(' ')}
        </p>
    )
}

function DiceTray() {
    const {
        history,
        trayOpen,
        notationInput,
        rollD20,
        rollDuality,
        rollNotation,
        clearHistory,
        setTrayOpen,
        setNotationInput,
    } = useDiceStore()
    const [invalidRoll, setInvalidRoll] = useState(false)
    const { currentCampaignId, applyRollOutcomeToActiveScenes } = useCampaignStore()
    const latest = history[0]


    const rollFlatD20 = () => {
        rollD20({ label: 'd20' })
        setInvalidRoll(false)
    }

    const rollDualityAction = () => {
        rollDuality({ label: 'Duality' })
        setInvalidRoll(false)
    }
    const rollInput = (modifierBonus = 0) => {
        const parsed = parseTrayRollInput(notationInput)
        if (!parsed || (parsed.kind === 'notation' && modifierBonus !== 0)) {
            setInvalidRoll(true)
            return
        }

        if (parsed.kind === 'notation') {
            const result = rollNotation(parsed.notation, { label: parsed.notation })
            setInvalidRoll(result === null)
            if (result) setNotationInput('')
            return
        }

        const modifier = parsed.modifier + modifierBonus
        rollD20({ modifier, label: modifier ? `d20 ${signed(modifier)}` : 'd20' })
        setInvalidRoll(false)
        setNotationInput('')
    }

    const applyDualityOutcome = (outcome?: 'success' | 'failure') => {
        if (!currentCampaignId || latest?.kind !== 'duality') return
        const resolved = outcome ?? latest.outcome
        if (!resolved) return
        applyRollOutcomeToActiveScenes(currentCampaignId, {
            outcome: resolved,
            tone: latest.outcomeTone,
            critical: latest.critical,
        })
    }

    return (
        <div className="relative shrink-0">
            {trayOpen && (
                <div className="absolute bottom-full right-0 mb-2 z-50 w-96 max-w-[calc(100vw-2.5rem)] bg-ui-surface border border-ui-surface2 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-display font-bold text-ui-text">Dice</p>
                        {history.length > 0 && (
                            <button onClick={clearHistory} className="text-[10px] text-ui-muted hover:text-ui-text transition-colors">
                                Clear
                            </button>
                        )}
                    </div>

                    <section className="flex flex-col gap-2">
                        <div className="grid grid-cols-4 gap-1">
                            <button type="button" onClick={() => rollInput(FLAT_ADVANTAGE_MODIFIER)} className="py-1.5 rounded-lg border border-ui-surface2 text-xs font-bold text-ui-muted hover:text-hope-gold hover:border-hope-primary transition-colors">
                                advantage
                            </button>
                            <button type="button" onClick={() => rollInput(-FLAT_ADVANTAGE_MODIFIER)} className="py-1.5 rounded-lg border border-ui-surface2 text-xs font-bold text-ui-muted hover:text-fear-light hover:border-fear-light transition-colors">
                                disadvantage
                            </button>
                            <button type="button" onClick={rollFlatD20} className="py-1.5 rounded-lg border border-ui-surface2 text-xs font-bold text-ui-muted hover:text-ui-text hover:border-hope-gold transition-colors">
                                d20
                            </button>
                            <button type="button" onClick={rollDualityAction} className="py-1.5 rounded-lg border border-hope-primary/40 bg-hope-primary/10 text-xs font-bold text-hope-gold hover:bg-hope-primary/20 transition-colors">
                                Duality
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <label className="sr-only" htmlFor="dice-roll">Roll</label>
                            <input
                                id="dice-roll"
                                type="text"
                                value={notationInput}
                                onChange={(e) => { setNotationInput(e.target.value); setInvalidRoll(false) }}
                                onKeyDown={(e) => { if (e.key === 'Enter') rollInput() }}
                                placeholder="d20 +4 or 2d10+6"
                                className={`flex-1 bg-ui-surface2/60 border rounded-lg px-3 py-1.5 text-xs text-ui-text outline-none transition-colors ${invalidRoll ? 'border-red-500' : 'border-ui-surface2 focus:border-hope-gold'}`}
                            />
                            <button onClick={() => rollInput()} className="text-xs bg-hope-primary hover:bg-hope-gold text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
                                Roll
                            </button>
                        </div>
                        {invalidRoll && <p className="text-[10px] text-red-500">Enter a modifier or dice notation</p>}
                    </section>

                    {latest && (
                        <div className="border-t border-ui-surface2 pt-3">
                            <ResultSummary result={latest} />
                        </div>
                    )}

                    {latest?.kind === 'duality' && currentCampaignId && (
                        <section className="bg-hope-primary/10 border border-hope-primary/25 rounded-lg p-3 flex items-center justify-between gap-2">
                            <span className="text-xs text-ui-text">Apply latest player roll to active scene countdowns</span>
                            {latest.outcome ? (
                                <button type="button" onClick={() => applyDualityOutcome()} className="px-2 py-1 rounded bg-hope-primary text-white text-xs font-semibold hover:bg-hope-gold transition-colors">Apply {latest.outcome}</button>
                            ) : (
                                <div className="flex gap-1.5">
                                    <button type="button" onClick={() => applyDualityOutcome('success')} className="px-2 py-1 rounded bg-hope-primary text-white text-xs font-semibold hover:bg-hope-gold transition-colors">Apply success</button>
                                    <button type="button" onClick={() => applyDualityOutcome('failure')} className="px-2 py-1 rounded bg-fear-light text-white text-xs font-semibold hover:bg-fear-secondary transition-colors">Apply failure</button>
                                </div>
                            )}
                        </section>
                    )}

                    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto border-t border-ui-surface2 pt-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">History</p>
                            {history.length > 0 && (
                                <button onClick={clearHistory} className="text-[10px] text-ui-muted hover:text-ui-text transition-colors">
                                    Clear
                                </button>
                            )}
                        </div>
                        {history.length === 0 && <p className="text-[11px] text-ui-muted">No rolls yet</p>}
                        {history.map((result) => (
                            <div key={result.id} className="rounded-lg bg-ui-surface2/30 px-2 py-1.5"><ResultSummary result={result} /></div>
                        ))}
                    </div>
                </div>
            )}

            <button type="button" onClick={() => setTrayOpen(!trayOpen)} title="Dice" className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 shadow-lg transition-colors ${trayOpen ? 'bg-hope-primary/15 border-hope-gold text-hope-gold' : 'bg-ui-surface2/60 border-ui-surface2 text-ui-text hover:border-hope-gold'}`}>
                <span className="font-display text-sm font-bold">Dice</span>
                {latest && !trayOpen && <span className="text-xs font-bold tabular-nums">{latest.total}</span>}
                {latest?.kind === 'duality' && !trayOpen && <span className="text-[10px] font-semibold">{latest.critical ? 'Critical Hope' : latest.outcomeTone === 'hope' ? 'Hope' : 'Fear'}</span>}
            </button>
        </div>
    )
}

export default DiceTray
