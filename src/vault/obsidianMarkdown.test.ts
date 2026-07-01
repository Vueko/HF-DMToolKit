import { describe, it, expect } from 'vitest'
import { extractFrontmatter, preprocessObsidian } from './obsidianMarkdown'

const noteIndex = new Map<string, string>([
  ['thornwall', 'Cities/Thornwall.md'],
  ['intro', 'Intro.md'],
])
const imageIndex = new Map<string, string>([['map.png', 'assets/map.png']])

describe('extractFrontmatter', () => {
  it('parses YAML frontmatter and strips it from body', () => {
    const res = extractFrontmatter('---\ntitle: Hi\ntags: [a, b]\n---\n# Body\n')
    expect(res.frontmatter).toEqual({ title: 'Hi', tags: ['a', 'b'] })
    expect(res.body).toBe('# Body\n')
  })
  it('returns null frontmatter when absent', () => {
    const res = extractFrontmatter('# Body')
    expect(res.frontmatter).toBeNull()
    expect(res.body).toBe('# Body')
  })
})

describe('preprocessObsidian', () => {
  it('resolves a wikilink to a markdown link (angle-wrapped url)', () => {
    expect(preprocessObsidian('See [[Thornwall]].', noteIndex, imageIndex))
      .toBe('See [Thornwall](<vault-note:Cities/Thornwall.md>).')
  })
  it('uses alias as display text', () => {
    expect(preprocessObsidian('[[Thornwall|the city]]', noteIndex, imageIndex))
      .toBe('[the city](<vault-note:Cities/Thornwall.md>)')
  })
  it('keeps heading in the url', () => {
    expect(preprocessObsidian('[[Thornwall#History]]', noteIndex, imageIndex))
      .toBe('[Thornwall](<vault-note:Cities/Thornwall.md#History>)')
  })
  it('leaves broken links literal', () => {
    expect(preprocessObsidian('[[Unknown]]', noteIndex, imageIndex)).toBe('[[Unknown]]')
  })
  it('resolves image embeds (angle-wrapped url)', () => {
    expect(preprocessObsidian('![[map.png]]', noteIndex, imageIndex))
      .toBe('![map.png](<vault-img:assets/map.png>)')
  })
  it('strips the size suffix from image embeds', () => {
    expect(preprocessObsidian('![[map.png|200]]', noteIndex, imageIndex))
      .toBe('![map.png](<vault-img:assets/map.png>)')
  })
  it('resolves subpath image embeds by basename', () => {
    expect(preprocessObsidian('![[sub/folder/map.png]]', noteIndex, imageIndex))
      .toBe('![map.png](<vault-img:assets/map.png>)')
  })
  it('handles note paths with spaces', () => {
    const ni = new Map([['casa dragoon', 'Mundo/Casa Dragoon/Casa Dragoon.md']])
    expect(preprocessObsidian('[[Casa Dragoon]]', ni, imageIndex))
      .toBe('[Casa Dragoon](<vault-note:Mundo/Casa Dragoon/Casa Dragoon.md>)')
  })
  it('does not transform inside fenced code blocks', () => {
    const md = '```\n[[Thornwall]]\n```'
    expect(preprocessObsidian(md, noteIndex, imageIndex)).toBe(md)
  })
  it('does not transform inside inline code spans', () => {
    expect(preprocessObsidian('use `[[Thornwall]]` literally', noteIndex, imageIndex))
      .toBe('use `[[Thornwall]]` literally')
  })
  it('still transforms links outside inline code on the same line', () => {
    expect(preprocessObsidian('`code` and [[Thornwall]]', noteIndex, imageIndex))
      .toBe('`code` and [Thornwall](<vault-note:Cities/Thornwall.md>)')
  })
})
