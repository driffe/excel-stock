import { Fragment, type ReactNode } from 'react'
import { useI18n } from '../i18n'
import type { TranslationKey } from '../i18n/en'

function I({ d, vb = '0 0 24 24' }: { d: string; vb?: string }) {
  return (
    <svg viewBox={vb}>
      <path d={d} />
    </svg>
  )
}

/** Render a label that may contain \n as <br/>-separated lines. */
function multiline(text: string): ReactNode {
  const parts = text.split('\n')
  return parts.map((p, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {p}
    </Fragment>
  ))
}

function RBtnBig({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rbtn big">
      {icon}
      <span className="lbl">
        {multiline(label)} <span className="caret">▾</span>
      </span>
    </div>
  )
}

export function RibbonTabs() {
  const { t } = useI18n()
  const tabs: TranslationKey[] = [
    'ribbon.tab.home',
    'ribbon.tab.insert',
    'ribbon.tab.draw',
    'ribbon.tab.pageLayout',
    'ribbon.tab.formulas',
    'ribbon.tab.data',
    'ribbon.tab.review',
    'ribbon.tab.view',
    'ribbon.tab.help',
  ]
  return (
    <div className="ribtabs">
      <div className="ribtab file">{t('ribbon.tab.file')}</div>
      {tabs.map((key) => (
        <div key={key} className={'ribtab' + (key === 'ribbon.tab.home' ? ' active' : '')}>
          {t(key)}
        </div>
      ))}
    </div>
  )
}

interface RibbonHomeProps {
  onSort: () => void
  onInsert: () => void
  onCond: () => void
  onCoffee: () => void
  onHelp: () => void
}

export function RibbonHome({ onSort, onInsert, onCond, onCoffee, onHelp }: RibbonHomeProps) {
  const { t } = useI18n()
  return (
    <div className="ribbon">
      {/* Clipboard */}
      <div className="rgroup">
        <div className="rgroup-body">
          <RBtnBig
            label={t('ribbon.btn.paste')}
            icon={
              <svg viewBox="0 0 24 24">
                <rect x="6" y="4" width="12" height="17" rx="1.5" fill="#fff" stroke="#9a9a9a" />
                <rect x="8.5" y="2.5" width="7" height="3.5" rx="1" fill="#E0E0E0" stroke="#9a9a9a" />
                <rect x="8" y="9" width="8" height="1.4" fill="#107C41" />
                <rect x="8" y="12" width="8" height="1.4" fill="#bdbdbd" />
                <rect x="8" y="15" width="5" height="1.4" fill="#bdbdbd" />
              </svg>
            }
          />
          <div className="rmini">
            <div className="ribtn" title={t('tip.cut')}>
              <I d="M9 3a3 3 0 00-2 5.2L9.6 11 4 18h2.5l4.5-5 4.5 5H18l-5.6-7 2.6-2.8A3 3 0 1013 6l-1 1-1-1a3 3 0 00-2-3z" />
            </div>
            <div className="ribtn" title={t('tip.copy')}>
              <I d="M8 2h9a1 1 0 011 1v12h-2V4H8V2zM5 6h9a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z" />
            </div>
            <div className="ribtn" title={t('tip.formatPainter')}>
              <I d="M3 4h13v5H3V4zm2 7h9v3a2 2 0 01-2 2h-1v6h-3v-6H7a2 2 0 01-2-2v-3z" />
            </div>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.clipboard')}</div>
      </div>

      {/* Font */}
      <div className="rgroup">
        <div
          className="rgroup-body"
          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, paddingTop: 4 }}
        >
          <div className="rmini-row">
            <div className="rcombo" style={{ width: 110 }}>
              Calibri <span className="caret">▾</span>
            </div>
            <div className="rcombo" style={{ width: 48 }}>
              11 <span className="caret">▾</span>
            </div>
            <div className="ribtn" title={t('tip.fontGrow')} style={{ fontSize: 13 }}>
              A<sup style={{ fontSize: 8 }}>▲</sup>
            </div>
            <div className="ribtn" title={t('tip.fontShrink')} style={{ fontSize: 10 }}>
              A<sup style={{ fontSize: 7 }}>▼</sup>
            </div>
          </div>
          <div className="rmini-row">
            <div className="ribtn bold-i" title={t('tip.bold')}>
              가
            </div>
            <div className="ribtn ital-i" title={t('tip.italic')}>
              가
            </div>
            <div className="ribtn und-i" title={t('tip.underline')}>
              가
            </div>
            <div className="ribtn" title={t('tip.border')}>
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" fill="none" stroke="#5a5a5a" strokeWidth="1.5" />
                <line x1="12" y1="4" x2="12" y2="20" stroke="#5a5a5a" />
                <line x1="4" y1="12" x2="20" y2="12" stroke="#5a5a5a" />
              </svg>
            </div>
            <div className="ribtn" title={t('tip.fillColor')}>
              <svg viewBox="0 0 24 24">
                <path d="M5 13l6-6 5 5-6 6a2 2 0 01-3 0l-2-2a2 2 0 010-3z" fill="#5a5a5a" />
                <rect x="4" y="20" width="16" height="3" fill="#FFC000" />
              </svg>
            </div>
            <div className="ribtn" title={t('tip.fontColor')}>
              <svg viewBox="0 0 24 24">
                <path d="M7 16L11 5h2l4 11h-2l-1-3H10l-1 3H7zm3.6-5h2.8L12 7l-1.4 4z" fill="#5a5a5a" />
                <rect x="6" y="19" width="12" height="3" fill="#C0392B" />
              </svg>
            </div>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.font')}</div>
      </div>

      {/* Alignment */}
      <div className="rgroup">
        <div
          className="rgroup-body"
          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, paddingTop: 4 }}
        >
          <div className="rmini-row">
            {[6, 12, 18].map((y, i) => (
              <div key={y} className="ribtn">
                <svg viewBox="0 0 24 24">
                  <line x1="4" y1={y} x2="20" y2={y} stroke="#5a5a5a" strokeWidth="1.6" />
                  <rect x="8" y={[8, 9, 8][i]} width="3" height={[8, 6, 8][i]} fill="#9a9a9a" />
                  <rect x="13" y={[8, 7, 4][i]} width="3" height={[8, 10, 12][i]} fill="#9a9a9a" />
                </svg>
              </div>
            ))}
            <div className="ribtn" title={t('tip.orientation')}>
              ↗
            </div>
          </div>
          <div className="rmini-row">
            <div className="ribtn" title={t('tip.alignLeft')}>
              <svg viewBox="0 0 24 24" stroke="#5a5a5a" strokeWidth="1.5">
                <line x1="4" y1="6" x2="18" y2="6" />
                <line x1="4" y1="10" x2="13" y2="10" />
                <line x1="4" y1="14" x2="18" y2="14" />
                <line x1="4" y1="18" x2="13" y2="18" />
              </svg>
            </div>
            <div className="ribtn" title={t('tip.alignCenter')}>
              <svg viewBox="0 0 24 24" stroke="#5a5a5a" strokeWidth="1.5">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="10" x2="17" y2="10" />
                <line x1="4" y1="14" x2="20" y2="14" />
                <line x1="7" y1="18" x2="17" y2="18" />
              </svg>
            </div>
            <div className="ribtn" title={t('tip.alignRight')}>
              <svg viewBox="0 0 24 24" stroke="#5a5a5a" strokeWidth="1.5">
                <line x1="6" y1="6" x2="20" y2="6" />
                <line x1="11" y1="10" x2="20" y2="10" />
                <line x1="6" y1="14" x2="20" y2="14" />
                <line x1="11" y1="18" x2="20" y2="18" />
              </svg>
            </div>
            <div className="ribtn" title={t('tip.wrapText')} style={{ fontSize: 9 }}>
              ⮐
            </div>
            <div className="ribtn" title={t('tip.mergeCenter')} style={{ fontSize: 9 }}>
              ↹
            </div>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.alignment')}</div>
      </div>

      {/* Number */}
      <div className="rgroup">
        <div
          className="rgroup-body"
          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, paddingTop: 4 }}
        >
          <div className="rmini-row">
            <div className="rcombo" style={{ width: 96 }}>
              {t('ribbon.combo.general')} <span className="caret">▾</span>
            </div>
          </div>
          <div className="rmini-row">
            <div className="ribtn" title={t('tip.currency')} style={{ fontWeight: 700 }}>
              $
            </div>
            <div className="ribtn" title={t('tip.percent')} style={{ fontWeight: 600 }}>
              %
            </div>
            <div className="ribtn" title={t('tip.comma')} style={{ fontWeight: 700, fontSize: 14 }}>
              ,
            </div>
            <div className="ribtn" title={t('tip.incDecimal')} style={{ fontSize: 10 }}>
              .0→
            </div>
            <div className="ribtn" title={t('tip.decDecimal')} style={{ fontSize: 10 }}>
              ←.0
            </div>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.number')}</div>
      </div>

      {/* Styles */}
      <div className="rgroup">
        <div className="rgroup-body">
          <div className="rbtn big" onClick={onCond}>
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="7" height="7" fill="#E15759" />
              <rect x="13" y="4" width="7" height="7" fill="#F1A340" />
              <rect x="4" y="13" width="7" height="7" fill="#76B041" />
              <rect x="13" y="13" width="7" height="7" fill="#4E79A7" />
            </svg>
            <span className="lbl">
              {multiline(t('ribbon.btn.conditionalFormatting'))} <span className="caret">▾</span>
            </span>
          </div>
          <RBtnBig
            label={t('ribbon.btn.formatAsTable')}
            icon={
              <svg viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="16" fill="#fff" stroke="#9a9a9a" />
                <rect x="3" y="4" width="18" height="4" fill="#107C41" />
                <line x1="9" y1="8" x2="9" y2="20" stroke="#cfcfcf" />
                <line x1="15" y1="8" x2="15" y2="20" stroke="#cfcfcf" />
                <line x1="3" y1="12" x2="21" y2="12" stroke="#cfcfcf" />
                <line x1="3" y1="16" x2="21" y2="16" stroke="#cfcfcf" />
              </svg>
            }
          />
          <RBtnBig
            label={t('ribbon.btn.cellStyles')}
            icon={
              <svg viewBox="0 0 24 24">
                <rect x="4" y="6" width="16" height="5" fill="#FCE4D6" stroke="#E0A080" />
                <rect x="4" y="13" width="16" height="5" fill="#DDEBF7" stroke="#9DC3E6" />
              </svg>
            }
          />
        </div>
        <div className="rgroup-label">{t('ribbon.group.styles')}</div>
      </div>

      {/* Cells */}
      <div className="rgroup">
        <div className="rgroup-body">
          <div className="rbtn" onClick={onInsert}>
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" fill="#fff" stroke="#9a9a9a" />
              <line x1="4" y1="10" x2="20" y2="10" stroke="#cfcfcf" />
              <line x1="4" y1="15" x2="20" y2="15" stroke="#cfcfcf" />
              <line x1="12" y1="4" x2="12" y2="20" stroke="#cfcfcf" />
              <circle cx="18" cy="18" r="5" fill="#107C41" />
              <line x1="18" y1="15.5" x2="18" y2="20.5" stroke="#fff" strokeWidth="1.6" />
              <line x1="15.5" y1="18" x2="20.5" y2="18" stroke="#fff" strokeWidth="1.6" />
            </svg>
            <span className="lbl">
              {t('ribbon.btn.insert')} <span className="caret">▾</span>
            </span>
          </div>
          <div className="rbtn">
            <svg viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" fill="#fff" stroke="#9a9a9a" />
              <line x1="4" y1="10" x2="20" y2="10" stroke="#cfcfcf" />
              <line x1="12" y1="4" x2="12" y2="20" stroke="#cfcfcf" />
              <circle cx="18" cy="18" r="5" fill="#C0392B" />
              <line x1="15.5" y1="18" x2="20.5" y2="18" stroke="#fff" strokeWidth="1.6" />
            </svg>
            <span className="lbl">
              {t('ribbon.btn.delete')} <span className="caret">▾</span>
            </span>
          </div>
          <div className="rbtn">
            <svg viewBox="0 0 24 24">
              <path
                d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4a8 8 0 00-.2-1.7l2-1.6-2-3.4-2.4 1a8 8 0 00-1.4-.8L15.7 2h-3.4l-.3 2.5a8 8 0 00-1.4.8l-2.4-1-2 3.4 2 1.6A8 8 0 004 12"
                fill="none"
                stroke="#5a5a5a"
                strokeWidth="1.4"
              />
            </svg>
            <span className="lbl">
              {t('ribbon.btn.format')} <span className="caret">▾</span>
            </span>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.cells')}</div>
      </div>

      {/* Editing */}
      <div className="rgroup">
        <div className="rgroup-body">
          <div className="rmini">
            <div className="ribtn" title={t('tip.autosum')} style={{ fontWeight: 700, color: '#107C41' }}>
              Σ
            </div>
            <div className="ribtn" title={t('tip.fill')}>
              ▾
            </div>
            <div className="ribtn" title={t('tip.clear')}>
              ⌫
            </div>
          </div>
          <div className="rbtn" onClick={onSort}>
            <svg viewBox="0 0 24 24">
              <path d="M4 7h9M4 12h6M4 17h3" stroke="#5a5a5a" strokeWidth="1.6" />
              <path d="M17 5v12m0 0l-3-3m3 3l3-3" stroke="#107C41" strokeWidth="1.6" fill="none" />
            </svg>
            <span className="lbl">
              {multiline(t('ribbon.btn.sortFilter'))} <span className="caret">▾</span>
            </span>
          </div>
          <div className="rbtn">
            <svg viewBox="0 0 24 24">
              <circle cx="10" cy="10" r="6" fill="none" stroke="#5a5a5a" strokeWidth="1.6" />
              <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#5a5a5a" strokeWidth="1.8" />
            </svg>
            <span className="lbl">
              {multiline(t('ribbon.btn.findSelect'))} <span className="caret">▾</span>
            </span>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.editing')}</div>
      </div>

      {/* Support — pushed to far right */}
      <div className="rgroup rgroup-support" style={{ marginLeft: 'auto', borderRight: 'none', borderLeft: '1px solid var(--line)' }}>
        <div className="rgroup-body" style={{ gap: 4 }}>
          <div className="rbtn big rib-coffee" onClick={onCoffee} title={t('titlebar.coffee')}>
            <i className="fa-solid fa-mug-hot" style={{ fontSize: 28 }} />
            <span className="lbl">{multiline(t('ribbon.btn.coffee'))}</span>
          </div>
          <div className="rbtn big" onClick={onHelp} title={t('titlebar.help')}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
            </svg>
            <span className="lbl">{multiline(t('ribbon.btn.help'))}</span>
          </div>
        </div>
        <div className="rgroup-label">{t('ribbon.group.support')}</div>
      </div>
    </div>
  )
}
