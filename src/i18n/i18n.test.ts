import { describe, it, expect } from 'vitest'
import { en } from './en'
import { ko } from './ko'

function tokens(s: string): string[] {
  return (s.match(/\{(\w+)\}/g) ?? []).sort()
}

describe('i18n dictionaries', () => {
  it('ko has exactly the same keys as en', () => {
    expect(Object.keys(ko).sort()).toEqual(Object.keys(en).sort())
  })

  it('every key has matching {token} placeholders in en and ko', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(tokens(en[key]), `placeholder mismatch for "${key}"`).toEqual(tokens(ko[key]))
    }
  })

  it('has no empty strings', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(en[key].length, `empty en value for "${key}"`).toBeGreaterThan(0)
      expect(ko[key].length, `empty ko value for "${key}"`).toBeGreaterThan(0)
    }
  })
})
