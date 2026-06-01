import { useEffect, useMemo, useRef, useState } from 'react'
import TitleBar from './components/TitleBar'
import { RibbonTabs, RibbonHome } from './components/Ribbon'
import FormulaBar from './components/FormulaBar'
import Grid, { type CellData, type EditState, type Sel } from './components/Grid'
import SheetTabs, { type TabItem } from './components/SheetTabs'
import StatusBar from './components/StatusBar'
import NewsPane from './components/NewsPane'
import AddDialog from './components/AddDialog'
import CoffeeDialog from './components/CoffeeDialog'
import HelpDialog from './components/HelpDialog'
import FilterMenu, { type FilterMode } from './components/FilterMenu'
import { useQuotes } from './hooks/useQuotes'
import { useNews } from './hooks/useNews'
import { useI18n } from './i18n'
import type { TranslationKey } from './i18n/en'
import { lookupName } from './api/names'
import { DEFAULT_SHEETS, FAV_SHEET_ID, type Sheet } from './data/sheets'
import { getDecoy } from './data/decoy'
import { colName, fmtChange, fmtPrice } from './lib/format'
import type { Quote } from './types'

const LS = 'excelstock_v4'
// Bump whenever DEFAULT_SHEETS gains symbols you want pushed into existing saved
// state. On load we run a one-time additive merge (see mergeDefaults) for anyone
// below this version, then stamp it so the merge never repeats.
const SHEETS_VERSION = 2
const TOTAL_COLS = 26
// Rows rendered for a watchlist sheet — enough to read as a spreadsheet while
// rendering ~half the cells of a fixed 100 (the grid re-renders on every quote tick).
const SHEET_ROWS = 50
const BAR_UP = 'rgba(26,126,60,.22)'
const BAR_DOWN = 'rgba(192,57,43,.20)'

interface SavedState {
  sheets: Sheet[]
  activeSheet: string
  favs: string[]
  /** Seed version the saved sheets were last merged against (absent ⇒ legacy v1). */
  version?: number
}

function loadSaved(): SavedState | null {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null')
    if (s && Array.isArray(s.sheets) && s.activeSheet) return s
  } catch {
    /* ignore */
  }
  return null
}

/**
 * One-time additive sync of DEFAULT_SHEETS into already-saved sheets. For each
 * default sheet the user still has, append any default symbols they're missing —
 * nothing is removed, reordered, or renamed, and deleted sheets stay deleted.
 * Gated by SHEETS_VERSION so it runs once per defaults bump, not every load.
 */
function mergeDefaults(saved: SavedState): Sheet[] {
  if ((saved.version ?? 1) >= SHEETS_VERSION) return saved.sheets
  return saved.sheets.map((sheet) => {
    const def = DEFAULT_SHEETS.find((d) => d.id === sheet.id)
    if (!def) return sheet
    const missing = def.symbols.filter((sym) => !sheet.symbols.includes(sym))
    return missing.length ? { ...sheet, symbols: [...sheet.symbols, ...missing] } : sheet
  })
}

function pad2(n: number) {
  return n < 10 ? '0' + n : '' + n
}
function timeStr(ms: number | null): string {
  if (!ms) return ''
  const d = new Date(ms)
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
}

/** Compare two symbols for sorting by ticker (col 0), price (col 1), or change (col 2). */
function compareSymbols(
  a: string,
  b: string,
  col: number,
  dir: 'asc' | 'desc',
  quotes: Record<string, Quote>,
): number {
  if (col === 0) return dir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  const key: 'price' | 'changePct' = col === 1 ? 'price' : 'changePct'
  const av = quotes[a]?.[key] ?? 0
  const bv = quotes[b]?.[key] ?? 0
  return dir === 'asc' ? av - bv : bv - av
}

export default function App() {
  const { t, lang } = useI18n()
  const saved = useMemo(loadSaved, [])

  const [sheets, setSheets] = useState<Sheet[]>(
    saved ? mergeDefaults(saved) : DEFAULT_SHEETS.map((s) => ({ ...s, symbols: [...s.symbols] })),
  )
  const [activeSheet, setActiveSheet] = useState<string>(
    saved ? saved.activeSheet : DEFAULT_SHEETS[0].id,
  )
  const [favs, setFavs] = useState<Set<string>>(new Set(saved?.favs ?? []))

  const [sel, setSel] = useState<Sel>({ r: 1, c: 0 })
  const [editing, setEditing] = useState<EditState | null>(null)
  const [editVal, setEditVal] = useState('')
  const [sortState, setSortState] = useState<Record<string, { col: number; dir: 'asc' | 'desc' }>>({})
  const [filterMode, setFilterMode] = useState<Record<string, FilterMode>>({})
  const [favFirst, setFavFirst] = useState<Record<string, boolean>>({})
  const [dataBars, setDataBars] = useState(true)
  const [openFilter, setOpenFilter] = useState<{ col: number; x: number; y: number } | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [decoy, setDecoy] = useState(false)
  const [flash, setFlash] = useState<Set<string>>(new Set())
  const [hint, setHint] = useState(() => !localStorage.getItem('excelstock_hint_seen'))
  const [renameId, setRenameId] = useState<string | null>(null)
  const [showNews, setShowNews] = useState(true)
  const [showCoffee, setShowCoffee] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [splitPct, setSplitPct] = useState(35)
  const [mobileSplitPct, setMobileSplitPct] = useState(55)
  const midrowRef = useRef<HTMLDivElement>(null)

  const isFav = !decoy && activeSheet === FAV_SHEET_ID
  const quotesRef = useRef<Record<string, Quote>>({})

  // ---- gather the symbol list for the current view ----
  // Returns a STABLE order (sheet order). The fav-sheet sort is applied later, in
  // `view` (display only) — sorting here would churn the polling key on every tick.
  function gatherFavs(): string[] {
    const seen = new Set<string>()
    const arr: string[] = []
    for (const sh of sheets) {
      for (const sym of sh.symbols) {
        if (favs.has(sym) && !seen.has(sym)) {
          seen.add(sym)
          arr.push(sym)
        }
      }
    }
    return arr
  }

  const activeSheetObj = sheets.find((s) => s.id === activeSheet)
  const list: string[] = decoy ? [] : isFav ? gatherFavs() : activeSheetObj?.symbols ?? []
  const listKey = list.join(',')

  const viewSymbols = useMemo(
    () => (decoy ? [] : list),
    // list identity changes with sheets/favs/sort; listKey keeps the dep stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decoy, listKey],
  )

  const {
    quotes,
    lastUpdated,
    loading: quotesLoading,
    error: quotesError,
    refresh: refreshQuotes,
  } = useQuotes(viewSymbols)
  const { news, indices, loading: newsLoading, refresh: refreshNews } = useNews(viewSymbols, lang)

  // Keep the latest quotes reachable inside sort callbacks without re-arming.
  quotesRef.current = quotes

  // ---- persistence ----
  useEffect(() => {
    localStorage.setItem(
      LS,
      JSON.stringify({ sheets, activeSheet, favs: [...favs], version: SHEETS_VERSION }),
    )
  }, [sheets, activeSheet, favs])

  // ---- document title / dismiss hint ----
  useEffect(() => {
    const fname = decoy ? getDecoy(lang).filename : t('app.filename')
    document.title = `${fname} - ${t('app.suffix')}`
  }, [decoy, lang, t])
  useEffect(() => {
    if (!hint) return
    const id = setTimeout(() => {
      setHint(false)
      localStorage.setItem('excelstock_hint_seen', '1')
    }, 5200)
    return () => clearTimeout(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // leave 관심 sheet when no favorites remain
  useEffect(() => {
    if (!decoy && activeSheet === FAV_SHEET_ID && favs.size === 0) {
      setActiveSheet(sheets[0]?.id ?? DEFAULT_SHEETS[0].id)
    }
  }, [favs, activeSheet, decoy, sheets])

  // ---- cell-flash when a visible quote actually changes ----
  const lastPrices = useRef<Record<string, number | null>>({})
  useEffect(() => {
    if (decoy) return
    // Detect which symbols' prices actually changed, then map them to the rows the
    // grid currently shows (`view`) — not raw `viewSymbols`, which is unfiltered/unsorted.
    const changed = new Set<string>()
    viewSymbols.forEach((sym) => {
      const price = quotes[sym]?.price ?? null
      const prev = lastPrices.current[sym]
      if (prev !== undefined && prev !== price && price != null) changed.add(sym)
      lastPrices.current[sym] = price
    })
    if (changed.size) {
      const touched = new Set<string>()
      view.forEach((v, i) => {
        if (changed.has(v.sym)) {
          touched.add(i + 1 + ',1')
          touched.add(i + 1 + ',2')
        }
      })
      if (touched.size) setFlash(touched)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes])
  useEffect(() => {
    if (flash.size) {
      const id = setTimeout(() => setFlash(new Set()), 700)
      return () => clearTimeout(id)
    }
  }, [flash])

  // ---- current view: filter + favorites-first (maps display row → source index) ----
  const fm = filterMode[activeSheet] || 'all'
  const ff = !!favFirst[activeSheet]
  let view: { sym: string; idx: number }[] = []
  if (!decoy) {
    view = list.map((sym, idx) => ({ sym, idx }))
    if (fm === 'up') view = view.filter((x) => (quotes[x.sym]?.changePct ?? 0) >= 0)
    else if (fm === 'down') view = view.filter((x) => (quotes[x.sym]?.changePct ?? 0) < 0)
    if (ff) {
      view = view
        .map((x, i) => ({ ...x, _i: i }))
        .sort((a, b) => (favs.has(b.sym) ? 1 : 0) - (favs.has(a.sym) ? 1 : 0) || a._i - b._i)
    }
    // Display-only sort for the favorites sheet (keeps the polling key stable).
    if (isFav) {
      const sc = sortState[FAV_SHEET_ID]
      if (sc) view = [...view].sort((a, b) => compareSymbols(a.sym, b.sym, sc.col, sc.dir, quotes))
    }
  }
  const maxAbs = Math.max(2, ...view.map((x) => Math.abs(quotes[x.sym]?.changePct ?? 0)))
  // The decoy renders exactly its rows; a watchlist renders a fixed SHEET_ROWS.
  const totalRows = decoy ? getDecoy(lang).rows.length : SHEET_ROWS

  function makeBar(c: number) {
    const half = Math.min(46, (Math.abs(c) / maxAbs) * 46)
    if (c >= 0) return { left: 50, width: half, color: BAR_UP }
    return { left: 50 - half, width: half, color: BAR_DOWN }
  }

  // ---- cell content ----
  function cellAt(r: number, c: number): CellData | null {
    if (decoy) {
      const D = getDecoy(lang)
      if (r >= D.rows.length) return null
      const row = D.rows[r]
      switch (row.type) {
        case 'title':
          return { text: c === 0 ? row.text : '', cls: 'bold dcoy-co' }
        case 'report':
          return c === 0 ? { text: row.text, cls: 'dcoy-rpt' } : null
        case 'meta':
          if (c < row.cells.length && row.cells[c] != null)
            return { text: String(row.cells[c]), cls: 'dcoy-meta' }
          return null
        case 'empty':
          return null
        case 'header':
          if (c < row.cells.length)
            return { text: row.cells[c], cls: 'bold dcoy-hdr', num: c > 0 }
          return { text: '', cls: 'dcoy-hdr' }
        case 'section':
          return { text: c === 0 ? row.text : '', cls: 'dcoy-sec' }
        case 'data': {
          if (c >= row.cells.length) return null
          const v = row.cells[c]
          if (v == null) return null
          const cls = row.total ? 'bold dcoy-tot' : row.sub ? 'bold dcoy-sub' : ''
          return {
            text: typeof v === 'number' ? v.toLocaleString('en-US') : String(v),
            num: c > 0,
            cls,
          }
        }
        case 'note':
          return c === 0 ? { text: row.text, cls: 'dcoy-note' } : null
      }
    }
    if (r === 0) {
      const h = [t('col.name'), t('col.price'), t('col.change')]
      return c < 3 ? { text: h[c], cls: 'bold' } : null
    }
    const i = r - 1
    if (i === view.length && c === 0 && !isFav) {
      return { text: t('grid.addHint'), hint: true }
    }
    if (i < view.length) {
      const sym = view[i].sym
      const q = quotes[sym]
      const on = favs.has(sym)
      if (c === 0) return { text: sym, star: { ticker: sym, on }, sub: lookupName(sym, lang) || undefined }
      if (c === 1) return { text: q?.price != null ? '$' + fmtPrice(q.price) : '—', num: true }
      if (c === 2) {
        const chg = q?.changePct
        if (chg == null) return { text: '—', num: true }
        return {
          text: fmtChange(chg),
          num: true,
          cls: chg >= 0 ? 'up' : 'down',
          bar: dataBars ? makeBar(chg) : null,
        }
      }
    }
    return null
  }

  function favRow(r: number): boolean {
    const i = r - 1
    return !decoy && !isFav && i >= 0 && i < view.length && favs.has(view[i].sym)
  }

  function formulaText(): string {
    const { r, c } = sel
    if (decoy) {
      if (r >= 3 && c === 4 && getDecoy(lang).rows[r - 3]) return `=C${r + 1}/B${r + 1}`
      const d = cellAt(r, c)
      return d ? d.text : ''
    }
    if (r === 0) {
      const d = cellAt(r, c)
      return d ? d.text : ''
    }
    const i = r - 1
    if (i < view.length) {
      const sym = view[i].sym
      if (c === 0) return lookupName(sym, lang) || sym
      if (c === 1) return `=A${r + 1}.Price`
      if (c === 2) return `=A${r + 1}.Change`
    }
    return ''
  }

  // ---- editing (symbol column only; price/change are live) ----
  function startEdit(r: number, c: number, initial?: string) {
    if (decoy || isFav || r === 0 || c !== 0) return
    const i = r - 1
    const idx = i < view.length ? view[i].idx : -1 // -1 => append
    let raw = ''
    if (initial !== undefined) raw = initial
    else if (idx >= 0) raw = list[idx]
    setSel({ r, c })
    setEditing({ r, c, idx })
    setEditVal(raw)
  }

  function mutateActiveSymbols(fn: (symbols: string[]) => string[]) {
    setSheets((prev) =>
      prev.map((s) => (s.id === activeSheet ? { ...s, symbols: fn(s.symbols) } : s)),
    )
  }

  function commitEdit(move?: 'down' | 'right' | null, cancel?: boolean) {
    if (!editing) return
    const { idx } = editing
    if (!cancel) {
      const v = editVal.trim().toUpperCase()
      mutateActiveSymbols((symbols) => {
        const next = [...symbols]
        if (idx >= 0) {
          if (v) next[idx] = v
          else next.splice(idx, 1)
        } else if (v && !next.includes(v)) {
          next.push(v)
        }
        return next
      })
    }
    setEditing(null)
    if (move === 'down') setSel((s) => ({ r: Math.min(totalRows - 1, s.r + 1), c: s.c }))
    else if (move === 'right') setSel((s) => ({ r: s.r, c: Math.min(TOTAL_COLS - 1, s.c + 1) }))
  }

  // ---- sorting ----
  function doSort(c: number, dir: 'asc' | 'desc') {
    if (decoy || c > 2 || !list.length) return
    if (isFav) {
      setSortState((s) => ({ ...s, [FAV_SHEET_ID]: { col: c, dir } }))
      return
    }
    mutateActiveSymbols((symbols) =>
      [...symbols].sort((a, b) => compareSymbols(a, b, c, dir, quotesRef.current)),
    )
    setSortState((s) => ({ ...s, [activeSheet]: { col: c, dir } }))
  }
  function onSortCol(c: number) {
    setSel({ r: sel.r, c })
    if (decoy || c > 2 || !list.length) return
    const cur = sortState[activeSheet]
    const dir = cur && cur.col === c && cur.dir === 'asc' ? 'desc' : 'asc'
    doSort(c, dir)
  }

  function toggleFav(sym: string) {
    setFavs((prev) => {
      const n = new Set(prev)
      if (n.has(sym)) n.delete(sym)
      else n.add(sym)
      return n
    })
  }
  function isFiltered(c: number) {
    return (c === 2 && fm !== 'all') || (c === 0 && ff)
  }

  // ---- split handle drag ----
  function onHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startPct = splitPct
    const totalW = midrowRef.current?.offsetWidth ?? 1
    function onMove(ev: MouseEvent) {
      const newPct = Math.min(70, Math.max(15, startPct + ((ev.clientX - startX) / totalW) * 100))
      setSplitPct(newPct)
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ---- split handle touch drag (mobile vertical) ----
  function onHandleTouchStart(e: React.TouchEvent) {
    e.preventDefault()
    const startY = e.touches[0].clientY
    const startPct = mobileSplitPct
    const totalH = midrowRef.current?.offsetHeight ?? 1
    function onMove(ev: TouchEvent) {
      const newPct = Math.min(85, Math.max(15, startPct + ((ev.touches[0].clientY - startY) / totalH) * 100))
      setMobileSplitPct(newPct)
    }
    function onEnd() {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  // ---- refresh ----
  function doRefresh() {
    if (decoy) return
    refreshQuotes()
    refreshNews()
  }

  // ---- search ----
  function onSearch(q: string) {
    const query = (q || '').trim().toUpperCase()
    if (!query) return
    for (const sh of sheets) {
      const idx = sh.symbols.findIndex((s) => s.toUpperCase().startsWith(query))
      if (idx >= 0) {
        setActiveSheet(sh.id)
        setFilterMode((f) => ({ ...f, [sh.id]: 'all' }))
        setFavFirst((f) => ({ ...f, [sh.id]: false }))
        setSel({ r: idx + 1, c: 0 })
        setFlash(new Set([idx + 1 + ',0', idx + 1 + ',1', idx + 1 + ',2']))
        return
      }
    }
  }

  // ---- add / sheets ----
  function addStock(ticker: string) {
    const v = ticker.toUpperCase().trim()
    if (!v) return
    const len = activeSheetObj?.symbols.length ?? 0
    mutateActiveSymbols((symbols) => (symbols.includes(v) ? symbols : [...symbols, v]))
    setShowAdd(false)
    setSel({ r: len + 1, c: 0 })
  }
  function addSheet() {
    let n = 1
    while (sheets.some((s) => s.id === 'sheet' + n)) n++
    const id = 'sheet' + n
    const name = `${t('sheet.newTab')} ${n}`
    setSheets((prev) => [...prev, { id, name, symbols: [] }])
    setActiveSheet(id)
  }
  function deleteSheet(id: string) {
    const idx = sheets.findIndex((s) => s.id === id)
    if (idx < 0 || sheets.length <= 1) return
    const target = sheets[idx]
    if (target.symbols.length > 0 && !window.confirm(t('sheet.deleteConfirm', { name: sheetLabel(target) }))) {
      return
    }
    const next = sheets.filter((s) => s.id !== id)
    setSheets(next)
    if (activeSheet === id) {
      setActiveSheet(next[Math.max(0, idx - 1)].id)
    }
  }

  function commitRename(id: string, val: string) {
    const v = val.trim()
    setRenameId(null)
    if (!v) return
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, name: v } : s)))
  }

  // ---- keyboard ----
  // Reassign the handler each render (fresh closures over sel/view/…) but arm the
  // window listener only once, so it isn't removed/re-added on every quote tick.
  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  onKeyRef.current = (e: KeyboardEvent) => {
    if (e.key === '`' || e.code === 'Backquote') {
      if (editing) return
      e.preventDefault()
      setDecoy((d) => !d)
      setOpenFilter(null)
      return
    }
    if (editing) return
    const target = e.target as HTMLElement | null
    const tag = target?.tagName?.toLowerCase()
    if (tag === 'input' && !target?.closest('.celledit')) return
    if (decoy) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => ({ r: Math.max(0, s.r - 1), c: s.c }))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => ({ r: Math.min(totalRows - 1, s.r + 1), c: s.c }))
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setSel((s) => ({ r: s.r, c: Math.max(0, s.c - 1) }))
    } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault()
      setSel((s) => ({ r: s.r, c: Math.min(TOTAL_COLS - 1, s.c + 1) }))
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault()
      startEdit(sel.r, sel.c)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      const i = sel.r - 1
      if (sel.c === 0 && sel.r >= 1 && i < view.length && !isFav) {
        const idx = view[i].idx
        mutateActiveSymbols((symbols) => symbols.filter((_, k) => k !== idx))
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (sel.c === 0) startEdit(sel.r, sel.c, e.key)
    }
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyRef.current(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ---- auto-conceal ----
  // The reflexive hide: the instant the window loses focus or the tab is hidden
  // (alt-tab, app switch, or you stepping away from the desk), flip to the decoy
  // budget sheet. We only ever CONCEAL — revealing stays a deliberate act (the boss
  // key), so an unattended screen never flips back to stocks on its own.
  // Skip on mobile: phone browsers fire blur/visibilitychange constantly (keyboard,
  // app switch, notification shade, scroll), which would flip the stock view to the
  // decoy nonstop. On mobile we keep the stock window and rely on the manual boss key.
  useEffect(() => {
    if (window.innerWidth <= 640) return
    const conceal = () => {
      setDecoy(true)
      setOpenFilter(null)
    }
    const onVisibility = () => {
      if (document.hidden) conceal()
    }
    window.addEventListener('blur', conceal)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', conceal)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // ---- derived display values ----
  const selRef = colName(sel.c) + (sel.r + 1)
  const sortCur = sortState[activeSheet]
  const selData = cellAt(sel.r, sel.c)
  const selNum =
    selData && selData.num ? parseFloat(String(selData.text).replace(/[^0-9.-]/g, '')) : null

  const ups = list.filter((s) => (quotes[s]?.changePct ?? 0) >= 0).length
  const downs = list.length - ups
  const avg = list.length
    ? list.reduce((a, s) => a + (quotes[s]?.changePct ?? 0), 0) / list.length
    : 0

  const isMobile = window.innerWidth <= 640
  const colW = decoy ? getDecoy(lang).colWidths : [160, isMobile ? 88 : 110, 96]
  const filename = decoy ? getDecoy(lang).filename : t('app.filename')

  // ---- tabs ----
  function sheetLabel(s: Sheet): string {
    if (s.name) return s.name
    return t(('sheet.' + s.id) as TranslationKey)
  }
  let tabs: TabItem[]
  let current: string
  if (decoy) {
    tabs = getDecoy(lang).sheets.map((label, i) => ({ id: 'decoy' + i, label }))
    current = 'decoy0'
  } else {
    tabs = sheets.map((s) => ({ id: s.id, label: sheetLabel(s) }))
    if (favs.size > 0) tabs.push({ id: FAV_SHEET_ID, label: t('sheet.fav'), fav: true })
    current = activeSheet
  }

  return (
    <div className="app">
      <TitleBar
        filename={filename}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        onSearch={onSearch}
      />
      <RibbonTabs />
      <RibbonHome
        onSort={() => onSortCol(sel.c)}
        onInsert={() => !decoy && setShowAdd(true)}
        onCond={() => setDataBars((v) => !v)}
        onCoffee={() => setShowCoffee(true)}
        onHelp={() => setShowHelp(true)}
      />
      <FormulaBar
        selRef={selRef}
        formula={formulaText()}
        refreshTime={!decoy ? timeStr(lastUpdated) : null}
        onRefresh={!decoy ? doRefresh : null}
        spinning={!decoy && quotesLoading}
        error={!decoy && quotesError}
      />
      <div className="midrow" ref={midrowRef}>
        <div className="grid-col" style={{ flex: showNews && !decoy ? `0 0 ${isMobile ? mobileSplitPct : splitPct}%` : 1, display: 'flex', minWidth: 0 }}>
          <Grid
            totalCols={TOTAL_COLS}
            totalRows={totalRows}
            colW={colW}
            sel={sel}
            setSel={(s) => {
              if (!editing) setSel(s)
            }}
            editing={editing}
            editVal={editVal}
            setEditVal={setEditVal}
            commitEdit={commitEdit}
            startEdit={startEdit}
            cellAt={cellAt}
            sortCol={!decoy && sortCur ? sortCur.col : -1}
            sortDir={sortCur ? sortCur.dir : 'asc'}
            onSortCol={onSortCol}
            flash={flash}
            headerFilterCols={decoy ? 0 : 3}
            onHeaderFilter={(c, rect) =>
              setOpenFilter((o) => (o && o.col === c ? null : { col: c, x: rect.left, y: rect.bottom }))
            }
            isFiltered={isFiltered}
            favRow={favRow}
            onToggleFav={toggleFav}
          />
        </div>
        {showNews && !decoy && (
          <>
            <div className="split-handle" onMouseDown={onHandleMouseDown} onTouchStart={onHandleTouchStart} />
            <div className="news-col" style={{ flex: 1, display: 'flex', minWidth: 0 }}>
              <NewsPane
                indices={indices}
                news={news}
                quotes={quotes}
                loading={newsLoading}
                onClose={() => setShowNews(false)}
                onRefresh={doRefresh}
              />
            </div>
          </>
        )}
      </div>

      <SheetTabs
        tabs={tabs}
        current={current}
        decoy={decoy}
        onSelect={setActiveSheet}
        renameId={renameId}
        onStartRename={setRenameId}
        onCommitRename={commitRename}
        onCancelRename={() => setRenameId(null)}
        onAddSheet={addSheet}
        onDeleteSheet={deleteSheet}
      />

      <StatusBar
        decoy={decoy}
        count={list.length}
        ups={ups}
        downs={downs}
        avg={avg}
        showNews={showNews}
        onToggleNews={() => setShowNews((v) => !v)}
        selNum={selNum}
      />

      {openFilter && (
        <FilterMenu
          col={openFilter.col}
          x={openFilter.x}
          y={openFilter.y}
          onClose={() => setOpenFilter(null)}
          doSort={doSort}
          filterMode={fm}
          setFilter={(mode) => setFilterMode((f) => ({ ...f, [activeSheet]: mode }))}
          favFirst={ff}
          toggleFavFirst={() => setFavFirst((f) => ({ ...f, [activeSheet]: !f[activeSheet] }))}
        />
      )}

      {showAdd && (
        <AddDialog
          sheetName={activeSheetObj ? sheetLabel(activeSheetObj) : ''}
          onClose={() => setShowAdd(false)}
          onAdd={addStock}
        />
      )}

      {showCoffee && <CoffeeDialog onClose={() => setShowCoffee(false)} />}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}

      <div className={'hint' + (hint ? ' show' : '')}>{renderHint(t('hint.bosskey'))}</div>
    </div>
  )
}

/** Render the boss-key hint, replacing the `{key}` placeholder with a <kbd>`</kbd>. */
function renderHint(text: string) {
  const [before, after] = text.split('{key}')
  return (
    <>
      {before}
      <kbd>`</kbd>
      {after}
    </>
  )
}
