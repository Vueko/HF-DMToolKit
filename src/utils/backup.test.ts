import { describe, it, expect } from 'vitest'
import type { Campaign, Card } from '../types'
import {
    APP_ID, FORMAT_VERSION,
    buildFullExport, buildCardsExport, parseImport,
    mergeCampaignsById, mergeCardsById, mergeCampaignBlobs,
} from './backup'

const camp = (id: string): Campaign => ({ id, name: id, scenes: [], sessions: [], playlists: [] })
const card = (id: string): Card => ({ id } as unknown as Card)
const AT = '2026-07-03T00:00:00.000Z'

describe('buildFullExport', () => {
    it('wraps present blobs in a versioned envelope and skips null ones', () => {
        const env = buildFullExport({ 'dh-fear': '{"state":{}}', 'dh-campaigns': null }, AT)
        expect(env.app).toBe(APP_ID)
        expect(env.kind).toBe('full')
        expect(env.formatVersion).toBe(FORMAT_VERSION)
        expect(env.exportedAt).toBe(AT)
        expect(env.data['dh-fear']).toBe('{"state":{}}')
        expect('dh-campaigns' in env.data).toBe(false)
    })
    it('strips vaultPath from dh-settings but keeps other settings', () => {
        const settings = JSON.stringify({ state: { fontSize: 'lg', vaultPath: 'C:/secret' }, version: 1 })
        const env = buildFullExport({ 'dh-settings': settings }, AT)
        const parsed = JSON.parse(env.data['dh-settings'])
        expect(parsed.state.vaultPath).toBeUndefined()
        expect(parsed.state.fontSize).toBe('lg')
        expect(parsed.version).toBe(1)
    })
})

describe('buildCardsExport', () => {
    it('wraps cards in a versioned envelope', () => {
        const env = buildCardsExport([card('a')], AT)
        expect(env).toEqual({ app: APP_ID, kind: 'cards', formatVersion: FORMAT_VERSION, exportedAt: AT, cards: [card('a')] })
    })
})

describe('parseImport', () => {
    it('recognizes a full envelope', () => {
        const raw = JSON.stringify({ app: APP_ID, kind: 'full', formatVersion: 1, exportedAt: AT, data: { 'dh-fear': '{}' } })
        expect(parseImport(raw)).toEqual({ kind: 'full', data: { 'dh-fear': '{}' }, legacy: false })
    })
    it('recognizes a legacy flat backup (no envelope)', () => {
        const raw = JSON.stringify({ 'dh-campaigns': '{"state":{}}', unrelated: 1 })
        const r = parseImport(raw)
        expect(r.kind).toBe('full')
        if (r.kind === 'full') { expect(r.legacy).toBe(true); expect(r.data).toEqual({ 'dh-campaigns': '{"state":{}}' }) }
    })
    it('recognizes a cards envelope', () => {
        const raw = JSON.stringify({ app: APP_ID, kind: 'cards', formatVersion: 1, exportedAt: AT, cards: [card('a')] })
        const r = parseImport(raw)
        expect(r.kind).toBe('cards')
        if (r.kind === 'cards') expect(r.cards).toHaveLength(1)
    })
    it('recognizes a raw array as cards-raw (SRD path)', () => {
        const r = parseImport(JSON.stringify([{ name: 'X' }]))
        expect(r.kind).toBe('cards-raw')
        if (r.kind === 'cards-raw') expect(r.items).toHaveLength(1)
    })
    it('rejects malformed JSON', () => {
        expect(parseImport('{not json').kind).toBe('invalid')
    })
    it('rejects an envelope from a wrong app', () => {
        const raw = JSON.stringify({ app: 'other', kind: 'full', formatVersion: 1, data: {} })
        expect(parseImport(raw).kind).toBe('invalid')
    })
    it('rejects a future formatVersion', () => {
        const raw = JSON.stringify({ app: APP_ID, kind: 'full', formatVersion: 999, data: {} })
        expect(parseImport(raw).kind).toBe('invalid')
    })
})

describe('mergeCampaignsById', () => {
    it('keeps existing and appends only new ids', () => {
        const merged = mergeCampaignsById([camp('a'), camp('b')], [camp('b'), camp('c')])
        expect(merged.map((c) => c.id)).toEqual(['a', 'b', 'c'])
    })
})

describe('mergeCardsById', () => {
    it('skips duplicate ids and counts added/skipped', () => {
        const r = mergeCardsById([card('a')], [card('a'), card('b')])
        expect(r.merged.map((c) => c.id)).toEqual(['a', 'b'])
        expect(r.added).toBe(1)
        expect(r.skipped).toBe(1)
    })
})

describe('mergeCampaignBlobs', () => {
    it('merges incoming campaigns into current and preserves current active refs', () => {
        const current = JSON.stringify({ state: { campaigns: [camp('a')], currentCampaignId: 'a', currentSessionId: 's1' }, version: 1 })
        const incoming = JSON.stringify({ state: { campaigns: [camp('a'), camp('b')], currentCampaignId: 'b', currentSessionId: null }, version: 1 })
        const out = JSON.parse(mergeCampaignBlobs(current, incoming))
        expect(out.state.campaigns.map((c: Campaign) => c.id)).toEqual(['a', 'b'])
        expect(out.state.currentCampaignId).toBe('a')
        expect(out.state.currentSessionId).toBe('s1')
        expect(out.version).toBe(1)
    })
    it('falls back to incoming when current is null', () => {
        const incoming = JSON.stringify({ state: { campaigns: [camp('x')] }, version: 1 })
        const out = JSON.parse(mergeCampaignBlobs(null, incoming))
        expect(out.state.campaigns.map((c: Campaign) => c.id)).toEqual(['x'])
        expect(out.state.currentCampaignId).toBeNull()
    })
})
