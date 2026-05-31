import { useI18n } from '../i18n'
import { fmtChange } from '../lib/format'
import { onActivate } from '../lib/a11y'

interface StatusBarProps {
  decoy: boolean
  count: number
  ups: number
  downs: number
  avg: number
  showNews: boolean
  onToggleNews: () => void
  /** Numeric value of the selected cell, for the Average/Sum stats, or null. */
  selNum: number | null
}

/** Bottom status bar: summary stats, news toggle, view icons, zoom. */
export default function StatusBar({
  decoy,
  count,
  ups,
  downs,
  avg,
  showNews,
  onToggleNews,
  selNum,
}: StatusBarProps) {
  const { t, lang } = useI18n()
  const fmtNum = (n: number) =>
    n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  const today = new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: lang === 'ko' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="statusbar">
      <span>{t('status.ready')}</span>
      {!decoy && <span className="sb-bosskey">{t('hint.bossmodeShort')}</span>}
      {!decoy && (
        <div className="sb-sum">
          <span>{t('status.count', { n: count })}</span>
          <span className="u">{t('status.up', { n: ups })}</span>
          <span className="d">{t('status.down', { n: downs })}</span>
          <span>
            {t('status.avg')}{' '}
            <span className={avg >= 0 ? 'u' : 'd'}>{fmtChange(avg)}</span>
          </span>
        </div>
      )}
      {!decoy && (
        <div
          className={'sb-news' + (showNews ? ' active' : '')}
          role="button"
          tabIndex={0}
          aria-pressed={showNews}
          aria-label={t('status.news')}
          onClick={onToggleNews}
          onKeyDown={onActivate(onToggleNews)}
          title={t('status.news')}
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 5h16v14a1 1 0 01-1 1H6a2 2 0 01-2-2V5zm2 3v3h6V8H6zm0 5v1.5h6V13H6zm8-5v6.5h4V8h-4z" />
          </svg>
          {t('status.news')}
        </div>
      )}
      <div className="sb-stat">
        <span className="sb-date">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="17" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.6" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.6" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {today}
        </span>
        {selNum !== null && (
          <>
            <span>{t('status.statAvg', { v: fmtNum(selNum) })}</span>
            <span>{t('status.statCount')}</span>
            <span>{t('status.statSum', { v: fmtNum(selNum) })}</span>
          </>
        )}
        <div className="sb-views">
          <div className="sb-view active" title={t('status.view.normal')}>
            <svg viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="14" fill="none" stroke="#107C41" strokeWidth="1.6" />
              <line x1="3" y1="9" x2="21" y2="9" stroke="#107C41" />
              <line x1="9" y1="9" x2="9" y2="19" stroke="#107C41" />
            </svg>
          </div>
          <div className="sb-view" title={t('status.view.pageLayout')}>
            <svg viewBox="0 0 24 24">
              <rect x="6" y="3" width="12" height="18" fill="none" stroke="#666" strokeWidth="1.6" />
            </svg>
          </div>
          <div className="sb-view" title={t('status.view.pageBreak')}>
            <svg viewBox="0 0 24 24">
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                fill="none"
                stroke="#666"
                strokeWidth="1.6"
                strokeDasharray="3 2"
              />
            </svg>
          </div>
        </div>
        <div className="sb-zoom">
          <span>100%</span>
          <div className="sb-slider" />
        </div>
      </div>
    </div>
  )
}
