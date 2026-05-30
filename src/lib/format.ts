/** Spreadsheet column letter for a 0-based index (0→A, 26→AA). */
export function colName(i: number): string {
  let s = ''
  let n = i + 1
  while (n > 0) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/** Price like Excel: thousands-separated ≥1000, 2dp ≥1, else 4dp. */
export function fmtPrice(p: number): string {
  if (p >= 1000)
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  return p.toFixed(4)
}

/** Signed percent change, e.g. "+0.84%" / "-1.23%". */
export function fmtChange(c: number): string {
  return (c >= 0 ? '+' : '') + c.toFixed(2) + '%'
}
