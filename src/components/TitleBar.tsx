import { useI18n } from '../i18n'
import { onActivate } from '../lib/a11y'

function I({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  )
}

interface TitleBarProps {
  filename: string
  searchVal: string
  setSearchVal: (v: string) => void
  onSearch: (q: string) => void
}

/** Excel green title bar: quick-access icons, search, language toggle, account, window buttons. */
export default function TitleBar({
  filename,
  searchVal,
  setSearchVal,
  onSearch,
}: TitleBarProps) {
  const { t, toggleLang } = useI18n()
  return (
    <div className="titlebar">
      <div className="tb-ico">X</div>
      <div className="tb-qbtn" title={t('tip.autosave')}>
        <svg viewBox="0 0 24 24">
          <circle cx="7" cy="12" r="4" fill="#fff" />
          <rect x="11" y="10" width="9" height="4" rx="2" fill="rgba(255,255,255,.5)" />
        </svg>
      </div>
      <div className="tb-qbtn" title={t('tip.save')}>
        <I d="M5 3h11l3 3v15H5V3zm2 2v5h8V6.8L13.2 5H7zm3 9a2 2 0 100 4 2 2 0 000-4z" />
      </div>
      <div className="tb-qbtn" title={t('tip.undo')}>
        <I d="M8 7V4L3 9l5 5v-3h6a4 4 0 010 8H9v2h5a6 6 0 000-12H8z" />
      </div>
      <div className="tb-qbtn" title={t('tip.redo')}>
        <I d="M16 7V4l5 5-5 5v-3h-6a4 4 0 000 8h5v2h-5a6 6 0 010-12h6z" />
      </div>
      <div className="tb-sep" />
      <div className="tb-search">
        <svg viewBox="0 0 24 24">
          <path d="M10 4a6 6 0 104.2 10.2l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z" />
        </svg>
        <input
          value={searchVal}
          placeholder={filename + '  ·  ' + t('titlebar.searchHint')}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch(searchVal)
            if (e.key === 'Escape') setSearchVal('')
          }}
        />
      </div>
      <div className="tb-right">
        <div
          className="tb-lang"
          role="button"
          tabIndex={0}
          aria-label={t('tip.lang')}
          onClick={toggleLang}
          onKeyDown={onActivate(toggleLang)}
          title={t('tip.lang')}
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="1.4" />
            <path
              d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18"
              fill="none"
              stroke="#fff"
              strokeWidth="1.2"
            />
          </svg>
          <span>{t('titlebar.lang')}</span>
        </div>
        <div className="tb-acct">
          <span>{t('titlebar.account')}</span>
          <div className="tb-avatar">{t('titlebar.account').charAt(0)}</div>
        </div>
        <div className="tb-win">
          <svg viewBox="0 0 12 12">
            <line x1="2" y1="6" x2="10" y2="6" />
          </svg>
        </div>
        <div className="tb-win">
          <svg viewBox="0 0 12 12">
            <rect x="2.5" y="2.5" width="7" height="7" />
          </svg>
        </div>
        <div className="tb-win close">
          <svg viewBox="0 0 12 12">
            <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
            <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
          </svg>
        </div>
      </div>
    </div>
  )
}
