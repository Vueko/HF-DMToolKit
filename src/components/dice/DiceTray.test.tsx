import { beforeEach, describe, expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { RollMode, RollResult } from '../../dice/roll'
import { rollDuality } from '../../dice/roll'
import DiceTray from './DiceTray'

vi.mock('../../store/campaignStore', () => ({
    useCampaignStore: () => ({ currentCampaignId: 'c1', applyRollOutcomeToActiveScenes: vi.fn() }),
}))

vi.mock('../../store/diceStore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../store/diceStore')>()
    type RealDiceState = ReturnType<typeof actual.useDiceStore.getState>

    let state: Pick<RealDiceState,
        | 'history'
        | 'trayOpen'
        | 'dualityModifier'
        | 'dualityAdvantage'
        | 'dualityDisadvantage'
        | 'dualityDifficulty'
        | 'd20Modifier'
        | 'd20Mode'
        | 'notationInput'
    > = {
        history: [],
        trayOpen: false,
        dualityModifier: 0,
        dualityAdvantage: 0,
        dualityDisadvantage: 0,
        dualityDifficulty: undefined,
        d20Modifier: 0,
        d20Mode: 'normal',
        notationInput: '',
    }

    const actions = {
        rollNotation: () => null,
        rollSpec: () => { throw new Error('not used') },
        rollDuality: () => { const result = rollDuality({}, () => 0); state = { ...state, history: [result] }; return result },
        rollD20: () => { throw new Error('not used') },
        logRoll: (result: RollResult) => { state = { ...state, history: [result, ...state.history] } },
        clearHistory: () => { state = { ...state, history: [] } },
        setTrayOpen: (trayOpen: boolean) => { state = { ...state, trayOpen } },
        setDualityModifier: (dualityModifier: number) => { state = { ...state, dualityModifier } },
        setDualityAdvantage: (dualityAdvantage: number) => { state = { ...state, dualityAdvantage } },
        setDualityDisadvantage: (dualityDisadvantage: number) => { state = { ...state, dualityDisadvantage } },
        setDualityDifficulty: (dualityDifficulty?: number) => { state = { ...state, dualityDifficulty } },
        setD20Modifier: (d20Modifier: number) => { state = { ...state, d20Modifier } },
        setD20Mode: (d20Mode: RollMode) => { state = { ...state, d20Mode } },
        setNotationInput: (notationInput: string) => { state = { ...state, notationInput } },
    }

    const fullState = () => ({ ...state, ...actions }) satisfies RealDiceState
    type FullState = ReturnType<typeof fullState>

    function useDiceStore<T = FullState>(selector?: (s: FullState) => T): T {
        return (selector ? selector(fullState()) : fullState()) as T
    }

    useDiceStore.getState = fullState
    useDiceStore.setState = (partial: Partial<typeof state>) => { state = { ...state, ...partial } }
    useDiceStore.subscribe = () => () => undefined

    return { ...actual, useDiceStore }
})

const { useDiceStore } = await import('../../store/diceStore')

beforeEach(() => {
    useDiceStore.setState({
        history: [],
        trayOpen: false,
        dualityModifier: 0,
        dualityAdvantage: 0,
        dualityDisadvantage: 0,
        dualityDifficulty: undefined,
        d20Modifier: 0,
        d20Mode: 'normal',
        notationInput: '',
    })
})

describe('DiceTray', () => {
    test('closed tray shows the dice button without history controls', () => {
        const html = renderToStaticMarkup(<DiceTray />)

        expect(html).toContain('Dice')
        expect(html).not.toContain('Duality')
    })

    test('open tray places quick roll buttons above one combined roll input', () => {
        useDiceStore.setState({ trayOpen: true })
        const html = renderToStaticMarkup(<DiceTray />)

        expect(html.match(/<input/g)?.length).toBe(1)
        expect(html).toContain('d20 +4 or 2d10+6')
        expect(html).toContain('advantage')
        expect(html).toContain('disadvantage')
        expect(html).toContain('d20')
        expect(html).toContain('Duality')
        expect(html.indexOf('advantage')).toBeLessThan(html.indexOf('placeholder="d20 +4 or 2d10+6"'))
        expect(html.indexOf('disadvantage')).toBeLessThan(html.indexOf('placeholder="d20 +4 or 2d10+6"'))
        expect(html.indexOf('d20')).toBeLessThan(html.indexOf('placeholder="d20 +4 or 2d10+6"'))
        expect(html.indexOf('Duality')).toBeLessThan(html.indexOf('placeholder="d20 +4 or 2d10+6"'))
        expect(html).not.toContain('>+6</button>')
        expect(html).not.toContain('>-6</button>')
        expect(html).not.toContain('d20 flat')
        expect(html).not.toContain('Attack')
        expect(html).not.toContain('Damage')
        expect(html).not.toContain('Difficulty')
        expect(html).not.toContain('Hope/Fear mod')
        expect(html).not.toContain('Attack modifier')
        expect(html).not.toContain('Advantage')
        expect(html).not.toContain('Disadvantage')
    })

    test('closed tray shows latest Duality total and tone', () => {
        const result = rollDuality({ label: 'Player action' }, () => 0)
        useDiceStore.setState({ trayOpen: false, history: [result] })

        const html = renderToStaticMarkup(<DiceTray />)

        expect(html).toContain('2')
        expect(html).toContain('Hope')
    })

    test('open tray shows manual countdown outcome buttons for Duality rolls without difficulty', () => {
        const result = rollDuality({ label: 'Player action' }, () => 0)
        useDiceStore.setState({ trayOpen: true, history: [result] })

        const html = renderToStaticMarkup(<DiceTray />)

        expect(html).toContain('Apply success')
        expect(html).toContain('Apply failure')
    })
})


