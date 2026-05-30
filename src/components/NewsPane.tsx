import { useState, type CSSProperties, type ReactNode } from 'react'
import { useI18n, relTime } from '../i18n'
import type { TranslationKey } from '../i18n/en'
import { colName, fmtChange } from '../lib/format'
import type { IndexQuote, NewsItem, Quote } from '../types'

interface NewsPaneProps {
  indices: IndexQuote[]
  news: NewsItem[]
  quotes: Record<string, Quote>
  onClose: () => void
  onRefresh: () => void
}

interface Cell {
  t?: string
  num?: boolean
  cls?: string
  wrap?: boolean
  link?: string
}
type Row =
  | { type: 'section'; text: string }
  | { type: 'th'; cells: string[] }
  | { type: 'blank' }
  | { type: 'row'; wrapRow?: boolean; cells: Cell[] }

const NCOL = 7
// headline/summary use unconstrained fr so they shrink before fixed right columns get cut off.
const TMPL = '30px 56px 72px 1.5fr 0.9fr 92px 72px 58px'

function isSafeUrl(url: string): boolean {
  try {
    const p = new URL(url).protocol
    return p === 'https:' || p === 'http:'
  } catch {
    return false
  }
}

/**
 * Stock news rendered as an Excel worksheet (column letters, row numbers, grid),
 * so the right pane reads like a second sheet rather than a news app. Ported from
 * the design's news.jsx; wired to live news + the indices strip + live quotes.
 */
export default function NewsPane({ indices, news, quotes, onClose, onRefresh }: NewsPaneProps) {
  const { t } = useI18n()
  const [sel, setSel] = useState({ r: 9, c: 5 })

  const rows: Row[] = []
  rows.push({ type: 'section', text: t('news.sectionIndices') })
  rows.push({
    type: 'th',
    cells: [t('news.idx.index'), t('news.idx.value'), t('news.idx.change'), '', '', '', ''],
  })
  indices.forEach((x) => {
    rows.push({
      type: 'row',
      cells: [
        { t: t(('index.' + x.key) as TranslationKey) },
        {
          t: x.value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
          num: true,
        },
        { t: fmtChange(x.changePct), num: true, cls: x.changePct >= 0 ? 'up' : 'down' },
        { t: '' },
        { t: '' },
        { t: '' },
        { t: '' },
      ],
    })
  })
  rows.push({ type: 'blank' })
  rows.push({ type: 'section', text: t('news.sectionNews') })
  rows.push({
    type: 'th',
    cells: [
      t('news.col.ticker'),
      t('news.col.change'),
      t('news.col.headline'),
      t('news.col.summary'),
      t('news.col.link'),
      t('news.col.source'),
      t('news.col.time'),
    ],
  })
  news.forEach((n) => {
    const tk = n.related[0]
    const chg = tk ? quotes[tk]?.changePct ?? null : null
    rows.push({
      type: 'row',
      wrapRow: true,
      cells: [
        { t: tk || '—' },
        chg != null
          ? { t: fmtChange(chg), num: true, cls: chg >= 0 ? 'up' : 'down' }
          : { t: '' },
        { t: n.headline, wrap: true },
        { t: n.summary, cls: 'sumcell', wrap: true },
        { link: n.url },
        { t: n.source, wrap: true },
        { t: relTime(n.datetime, t) },
      ],
    })
  })
  while (rows.length < 40) rows.push({ type: 'blank' })

  const els: ReactNode[] = []
  els.push(<div key="cn" className="corner" />)
  for (let c = 0; c < NCOL; c++) {
    els.push(
      <div key={'ch' + c} className={'colhdr' + (sel.c === c ? ' hot' : '')}>
        {colName(c)}
      </div>,
    )
  }
  rows.forEach((row, r) => {
    els.push(
      <div key={'rh' + r} className={'rowhdr' + (sel.r === r ? ' hot' : '')}>
        {r + 1}
      </div>,
    )
    if (row.type === 'section') {
      els.push(
        <div key={'s' + r} className="gcell cellfont np-section" style={{ gridColumn: 'span 7' }}>
          {row.text}
        </div>,
      )
    } else if (row.type === 'th') {
      row.cells.forEach((th, c) =>
        els.push(
          <div key={'t' + r + '_' + c} className="gcell cellfont np-th2">
            {th}
          </div>,
        ),
      )
    } else if (row.type === 'blank') {
      for (let c = 0; c < NCOL; c++) els.push(<div key={'b' + r + '_' + c} className="gcell" />)
    } else {
      row.cells.forEach((cell, c) => {
        const isSel = sel.r === r && sel.c === c
        let cls = 'gcell cellfont'
        if (cell.num) cls += ' num'
        if (cell.cls) cls += ' ' + cell.cls
        if (row.wrapRow) cls += ' newscell'
        if (cell.wrap) cls += ' wrapcell'
        const style: CSSProperties | undefined = isSel
          ? { boxShadow: 'inset 0 0 0 2px var(--green)', position: 'relative', zIndex: 1 }
          : undefined
        els.push(
          <div
            key={'d' + r + '_' + c}
            className={cls}
            style={style}
            onMouseDown={() => setSel({ r, c })}
          >
            {cell.link ? (
              <a
                className="np-link"
                href={isSafeUrl(cell.link) ? cell.link : '#'}
                target="_blank"
                rel="noopener noreferrer"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {t('news.link')}
              </a>
            ) : (
              cell.t
            )}
          </div>,
        )
      })
    }
  })

  return (
    <div className="newspane">
      <div className="np-head">
        <svg className="np-sheeticon" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="16" rx="1" fill="none" stroke="#107C41" strokeWidth="1.6" />
          <line x1="3" y1="9" x2="21" y2="9" stroke="#107C41" />
          <line x1="9" y1="9" x2="9" y2="20" stroke="#107C41" />
          <line x1="15" y1="9" x2="15" y2="20" stroke="#107C41" />
        </svg>
        <span className="np-title">{t('news.title')}</span>
        <span className="spacer" />
        <div className="np-ibtn" title={t('news.refresh')} onClick={onRefresh}>
          <svg viewBox="0 0 24 24">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </div>
        <div className="np-ibtn" title={t('news.close')} onClick={onClose}>
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6L6 18" stroke="#777" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
      <div className="np-sheet">
        <div className="np-grid" style={{ gridTemplateColumns: TMPL }}>
          {els}
        </div>
      </div>
    </div>
  )
}
