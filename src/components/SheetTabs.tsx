import { useState } from 'react'
import { useI18n } from '../i18n'

export interface TabItem {
  id: string
  label: string
  fav?: boolean
}

interface SheetTabsProps {
  tabs: TabItem[]
  current: string
  decoy: boolean
  onSelect: (id: string) => void
  renameId: string | null
  onStartRename: (id: string) => void
  onCommitRename: (id: string, val: string) => void
  onCancelRename: () => void
  onAddSheet: () => void
  onDeleteSheet: (id: string) => void
}

interface CtxMenu {
  id: string
  x: number
  y: number
  fav: boolean
}

/** Bottom sheet-tab strip: select, rename (double-click or right-click), delete, favorites tab, and add. */
export default function SheetTabs({
  tabs,
  current,
  decoy,
  onSelect,
  renameId,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onAddSheet,
  onDeleteSheet,
}: SheetTabsProps) {
  const { t } = useI18n()
  const [ctx, setCtx] = useState<CtxMenu | null>(null)

  function handleRightClick(e: React.MouseEvent, tab: TabItem) {
    if (decoy) return
    e.preventDefault()
    setCtx({ id: tab.id, x: e.clientX, y: e.clientY, fav: !!tab.fav })
  }

  function closeCtx() {
    setCtx(null)
  }

  return (
    <div className="sheetbar">
      <div className="sheetnav">
        <svg viewBox="0 0 24 24">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        <svg viewBox="0 0 24 24">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="sheet-tabs">
        {tabs.map((tab) => {
          const isRenaming = renameId === tab.id && !tab.fav && !decoy
          return (
            <div
              key={tab.id}
              className={
                'stab' +
                (tab.id === current ? ' active' : '') +
                (tab.fav ? ' favtab' : '')
              }
              onClick={() => !decoy && onSelect(tab.id)}
              onDoubleClick={() => {
                if (!decoy && !tab.fav) onStartRename(tab.id)
              }}
              onContextMenu={(e) => handleRightClick(e, tab)}
            >
              {isRenaming ? (
                <input
                  className="edit"
                  autoFocus
                  defaultValue={tab.label}
                  onBlur={(e) => onCommitRename(tab.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCommitRename(tab.id, e.currentTarget.value)
                    if (e.key === 'Escape') onCancelRename()
                  }}
                />
              ) : tab.fav ? (
                <span>★ {tab.label}</span>
              ) : (
                tab.label
              )}
            </div>
          )
        })}
        {!decoy && (
          <div className="stab-add" onClick={onAddSheet} title={t('sheet.add')}>
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="6" x2="12" y2="18" stroke="#777" strokeWidth="2" />
              <line x1="6" y1="12" x2="18" y2="12" stroke="#777" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>

      {ctx && (
        <>
          <div className="ctx-scrim" onMouseDown={closeCtx} />
          <div
            className="ctx-menu"
            style={{ left: ctx.x, bottom: window.innerHeight - ctx.y + 4 }}
          >
            {!ctx.fav && (
              <div
                className="ctx-item"
                onClick={() => { onStartRename(ctx.id); closeCtx() }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
                {t('sheet.rename')}
              </div>
            )}
            {!ctx.fav && (
              <div
                className="ctx-item ctx-item-danger"
                onClick={() => { onDeleteSheet(ctx.id); closeCtx() }}
              >
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
                {t('sheet.delete')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
