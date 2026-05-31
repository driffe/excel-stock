import { useI18n } from '../i18n'

// Update this URL to your Ko-fi or Buy Me a Coffee page
const COFFEE_URL = 'https://ko-fi.com'

export default function CoffeeDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className="modal coffee-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-tt">
          <span>☕ {t('coffee.title')}</span>
          <span className="x" onClick={onClose}>✕</span>
        </div>
        <div className="modal-body coffee-body">
          <div className="coffee-icon">☕</div>
          <p className="coffee-msg">{t('coffee.msg')}</p>
        </div>
        <div className="modal-foot" style={{ justifyContent: 'center', gap: 10 }}>
          <button className="btn" onClick={onClose}>{t('coffee.close')}</button>
          <a
            className="btn primary"
            href={COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('coffee.btn')}
          </a>
        </div>
      </div>
    </div>
  )
}
