import { useI18n } from '../i18n'

interface FormulaBarProps {
  selRef: string
  formula: string
  refreshTime: string | null
  onRefresh: (() => void) | null
  spinning: boolean
}

/** Excel formula bar: name box, fx area, the cell formula, and a quote-refresh button. */
export default function FormulaBar({
  selRef,
  formula,
  refreshTime,
  onRefresh,
  spinning,
}: FormulaBarProps) {
  const { t } = useI18n()
  return (
    <div className="fbar">
      <div className="namebox cellfont">
        {selRef}
        <span className="caret">▾</span>
      </div>
      <div className="fbar-fx">
        <span style={{ fontSize: 11 }}>✕</span>
        <span style={{ fontSize: 11 }}>✓</span>
        <span className="fx">fx</span>
      </div>
      <div className="fbar-input cellfont">{formula}</div>
      {onRefresh && (
        <div
          className={'fbar-refresh' + (spinning ? ' spin' : '')}
          onClick={onRefresh}
          title={t('fbar.refresh')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
          {refreshTime}
        </div>
      )}
    </div>
  )
}
