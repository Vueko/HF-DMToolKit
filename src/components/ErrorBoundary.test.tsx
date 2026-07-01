import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary'

describe('ErrorBoundary.getDerivedStateFromError', () => {
    it('captures the error into state', () => {
        const err = new Error('boom')
        expect(ErrorBoundary.getDerivedStateFromError(err)).toEqual({ error: err })
    })
})

describe('ErrorFallback', () => {
    it('renders the page fallback with the error message', () => {
        const html = renderToStaticMarkup(<ErrorFallback variant="page" error={new Error('boom')} />)
        expect(html).toContain('Algo salió mal en esta sección')
        expect(html).toContain('boom')
    })
    it('renders the root fallback', () => {
        const html = renderToStaticMarkup(<ErrorFallback variant="root" error={new Error('x')} />)
        expect(html).toContain('La aplicación encontró un error')
    })
})

describe('ErrorBoundary render (no error)', () => {
    it('renders children when there is no error', () => {
        const html = renderToStaticMarkup(
            <ErrorBoundary variant="page"><span>ok</span></ErrorBoundary>,
        )
        expect(html).toContain('ok')
        expect(html).not.toContain('Algo salió mal')
    })
})
