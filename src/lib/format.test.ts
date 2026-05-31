import { describe, it, expect } from 'vitest'
import { colName, fmtPrice, fmtChange } from './format'

describe('colName', () => {
  it('maps a 0-based index to spreadsheet letters', () => {
    expect(colName(0)).toBe('A')
    expect(colName(25)).toBe('Z')
    expect(colName(26)).toBe('AA')
    expect(colName(27)).toBe('AB')
    expect(colName(51)).toBe('AZ')
    expect(colName(52)).toBe('BA')
  })
})

describe('fmtPrice', () => {
  it('thousands-separates with 2dp at >= 1000', () => {
    expect(fmtPrice(1234.5)).toBe('1,234.50')
    expect(fmtPrice(96420.5)).toBe('96,420.50')
  })
  it('uses 2dp for >= 1', () => {
    expect(fmtPrice(229.5)).toBe('229.50')
    expect(fmtPrice(1)).toBe('1.00')
  })
  it('uses 4dp for < 1', () => {
    expect(fmtPrice(0.412)).toBe('0.4120')
  })
})

describe('fmtChange', () => {
  it('prepends a sign and uses 2dp', () => {
    expect(fmtChange(0.84)).toBe('+0.84%')
    expect(fmtChange(-1.23)).toBe('-1.23%')
    expect(fmtChange(0)).toBe('+0.00%')
  })
})
