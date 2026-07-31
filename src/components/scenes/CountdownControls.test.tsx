import { describe, expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CountdownControls } from './CountdownControls'
import type { Scene } from '../../types'

const scene = (over: Partial<Scene>): Scene => ({
    id: 's1',
    title: 'Scene',
    status: 'active',
    flag: '',
    count: 0,
    ...over,
})

describe('CountdownControls', () => {
    test('renders legacy count/countMax as a remaining standard countdown', () => {
        const html = renderToStaticMarkup(
            <CountdownControls scene={scene({ count: 2, countMax: 6 })} onUpdate={() => undefined} compact />,
        )

        expect(html).toContain('Clock')
        expect(html).toContain('standard')
        expect(html).toContain('4 / 6')
    })

    test('renders multiple countdown types', () => {
        const html = renderToStaticMarkup(
            <CountdownControls
                scene={scene({
                    countdowns: [
                        { id: 'a', title: 'Gate', type: 'progress', value: 3, max: 4 },
                        { id: 'b', title: 'Alarm', type: 'consequence', value: 2, max: 6 },
                    ],
                })}
                onUpdate={() => undefined}
            />,
        )

        expect(html).toContain('Gate')
        expect(html).toContain('progress')
        expect(html).toContain('Alarm')
        expect(html).toContain('consequence')
    })
})
