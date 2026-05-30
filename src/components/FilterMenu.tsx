import { useI18n } from '../i18n'

export type FilterMode = 'all' | 'up' | 'down'

interface FilterMenuProps {
  col: number
  x: number
  y: number
  onClose: () => void
  doSort: (col: number, dir: 'asc' | 'desc') => void
  filterMode: FilterMode
  setFilter: (mode: FilterMode) => void
  favFirst: boolean
  toggleFavFirst: () => void
}

const AscIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M6 6h12M6 11h8M6 16h4" stroke="#5a5a5a" strokeWidth="1.6" fill="none" />
    <path d="M18 9V19m0 0l-2.5-2.5M18 19l2.5-2.5" stroke="#107C41" strokeWidth="1.6" fill="none" />
  </svg>
)
const DescIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M6 6h4M6 11h8M6 16h12" stroke="#5a5a5a" strokeWidth="1.6" fill="none" />
    <path d="M18 19V9m0 0l-2.5 2.5M18 9l2.5 2.5" stroke="#107C41" strokeWidth="1.6" fill="none" />
  </svg>
)

/** Excel autofilter dropdown: sort asc/desc, favorites-first (name col), gain/loss filter. */
export default function FilterMenu({
  col,
  x,
  y,
  onClose,
  doSort,
  filterMode,
  setFilter,
  favFirst,
  toggleFavFirst,
}: FilterMenuProps) {
  const { t } = useI18n()
  const left = Math.min(x - 180, window.innerWidth - 224)
  const top = Math.min(y + 2, window.innerHeight - 230)
  const numeric = col !== 0

  const filterRows: [FilterMode, string][] = [
    ['all', t('filter.all')],
    ['up', t('filter.up')],
    ['down', t('filter.down')],
  ]

  return (
    <>
      <div className="fmenu-scrim" onMouseDown={onClose} />
      <div className="fmenu" style={{ left, top }}>
        <div
          className="fmi"
          onMouseDown={() => {
            doSort(col, 'asc')
            onClose()
          }}
        >
          {AscIcon}
          {numeric ? t('filter.sortAscNum') : t('filter.sortAscText')}
        </div>
        <div
          className="fmi"
          onMouseDown={() => {
            doSort(col, 'desc')
            onClose()
          }}
        >
          {DescIcon}
          {numeric ? t('filter.sortDescNum') : t('filter.sortDescText')}
        </div>
        {col === 0 && (
          <>
            <div className="fmsep" />
            <div
              className="fmi"
              onMouseDown={() => {
                toggleFavFirst()
                onClose()
              }}
            >
              <span className="rk">{favFirst ? '✓' : ''}</span>
              {t('filter.favFirst')}
            </div>
          </>
        )}
        {col === 2 && (
          <>
            <div className="fmsep" />
            <div className="fmlabel">{t('filter.changeLabel')}</div>
            {filterRows.map(([mode, label]) => (
              <div
                className="fmi"
                key={mode}
                onMouseDown={() => {
                  setFilter(mode)
                  onClose()
                }}
              >
                <span className="rk">{filterMode === mode ? '●' : '○'}</span>
                {label}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}
