import type { CSSProperties } from 'react'
import { colName } from '../lib/format'

/** Rendered content of a single grid cell. */
export interface CellData {
  text: string
  num?: boolean
  cls?: string
  star?: { ticker: string; on: boolean }
  bar?: { left: number; width: number; color: string } | null
  sub?: string
  hint?: boolean
}

export interface Sel {
  r: number
  c: number
}

export interface EditState {
  r: number
  c: number
  idx: number
}

interface GridProps {
  totalCols: number
  totalRows: number
  colW: number[]
  sel: Sel
  setSel: (s: Sel) => void
  editing: EditState | null
  editVal: string
  setEditVal: (v: string) => void
  commitEdit: (move?: 'down' | 'right' | null, cancel?: boolean) => void
  startEdit: (r: number, c: number, initial?: string) => void
  cellAt: (r: number, c: number) => CellData | null
  sortCol: number
  sortDir: 'asc' | 'desc'
  onSortCol: (c: number) => void
  flash: Set<string>
  headerFilterCols?: number
  onHeaderFilter?: (c: number, rect: DOMRect) => void
  isFiltered?: (c: number) => boolean
  favRow?: (r: number) => boolean
  onToggleFav?: (ticker: string) => void
}

/**
 * A faithful Excel worksheet grid: column letters, row numbers, green selection
 * box with fill handle, inline editing, data bars, favorite stars, and
 * autofilter header buttons. Ported from the design prototype's grid.jsx.
 */
export default function Grid({
  totalCols,
  totalRows,
  colW,
  sel,
  setSel,
  editing,
  editVal,
  setEditVal,
  commitEdit,
  startEdit,
  cellAt,
  sortCol,
  sortDir,
  onSortCol,
  flash,
  headerFilterCols = 0,
  onHeaderFilter,
  isFiltered,
  favRow,
  onToggleFav,
}: GridProps) {
  const widths = Array.from({ length: totalCols }, (_, c) => (colW[c] || 64) + 'px')
  const tmpl = '34px ' + widths.join(' ')

  const cells = []
  cells.push(<div key="corner" className="corner" />)
  for (let c = 0; c < totalCols; c++) {
    const hot = sel.c === c
    const isSort = sortCol === c
    cells.push(
      <div
        key={'ch' + c}
        className={'colhdr' + (hot ? ' hot' : '')}
        onClick={() => onSortCol(c)}
      >
        {colName(c)}
        {isSort && <span className="sortarrow">{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </div>,
    )
  }

  for (let r = 0; r < totalRows; r++) {
    const rhot = sel.r === r
    const fav = favRow?.(r)
    cells.push(
      <div key={'rh' + r} className={'rowhdr' + (rhot ? ' hot' : '')}>
        {r + 1}
      </div>,
    )
    for (let c = 0; c < totalCols; c++) {
      const data = cellAt(r, c)
      const isSel = sel.r === r && sel.c === c
      const isEdit = editing != null && editing.r === r && editing.c === c
      const fkey = r + ',' + c
      let cls = 'gcell cellfont'
      if (data) {
        if (data.num) cls += ' num'
        if (data.cls) cls += ' ' + data.cls
        if (data.star) cls += ' namecell'
      }
      if (fav) cls += ' favrow'
      const isHdrFilter = headerFilterCols > 0 && r === 0 && c < headerFilterCols && !!data
      if (isHdrFilter) cls += ' hdrcell'

      const style: CSSProperties = {}
      if (isSel) {
        style.boxShadow = 'inset 0 0 0 2px var(--green)'
        style.position = 'relative'
        style.zIndex = 1
      }

      cells.push(
        <div
          key={'c' + r + '_' + c}
          className={cls + (flash.has(fkey) ? ' cellflash' : '')}
          style={style}
          onMouseDown={() => !isEdit && setSel({ r, c })}
          onDoubleClick={() => startEdit(r, c)}
        >
          {data?.bar && (
            <span
              className="databar"
              style={{
                left: data.bar.left + '%',
                width: data.bar.width + '%',
                background: data.bar.color,
              }}
            />
          )}
          {data?.star && onToggleFav && (
            <span
              className={'favstar' + (data.star.on ? ' on' : '')}
              onMouseDown={(e) => {
                e.stopPropagation()
                onToggleFav(data.star!.ticker)
              }}
            >
              ★
            </span>
          )}
          {isEdit ? (
            <input
              className="celledit"
              autoFocus
              style={{ left: -2, top: -2, width: (colW[c] || 64) + 2, height: 21 }}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onBlur={() => commitEdit()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitEdit('down')
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  commitEdit(null, true)
                } else if (e.key === 'Tab') {
                  e.preventDefault()
                  commitEdit('right')
                }
              }}
            />
          ) : data ? (
            <>
              <span className={data.hint ? 'cellhint' : 'celltext'}>{data.text}</span>
              {data.sub && <span className="cellsub">{data.sub}</span>}
            </>
          ) : (
            ''
          )}
          {isHdrFilter && onHeaderFilter && (
            <span
              className={'filterbtn' + (isFiltered?.(c) ? ' on' : '')}
              onMouseDown={(e) => {
                e.stopPropagation()
                onHeaderFilter(c, e.currentTarget.getBoundingClientRect())
              }}
            >
              {isFiltered?.(c) ? (
                <svg viewBox="0 0 24 24">
                  <path d="M3 4h18l-7 8v7l-4-2v-5z" />
                </svg>
              ) : (
                '▼'
              )}
            </span>
          )}
          {isSel && !isEdit && (
            <span
              style={{
                position: 'absolute',
                right: -3,
                bottom: -3,
                width: 6,
                height: 6,
                background: 'var(--green)',
                border: '1px solid #fff',
                zIndex: 2,
              }}
            />
          )}
        </div>,
      )
    }
  }

  return (
    <div className="gridwrap" id="gridwrap">
      <div className="grid" style={{ gridTemplateColumns: tmpl }}>
        {cells}
      </div>
    </div>
  )
}
