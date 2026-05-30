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
}

/** Bottom sheet-tab strip: select, rename (double-click), favorites tab, and add. */
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
}: SheetTabsProps) {
  const { t } = useI18n()
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
    </div>
  )
}
