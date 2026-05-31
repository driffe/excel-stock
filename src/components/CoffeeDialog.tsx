import { useI18n } from '../i18n'
import { useEscapeKey } from '../hooks/useEscapeKey'

// Update this URL to your Ko-fi or Buy Me a Coffee page
const COFFEE_URL = 'https://buymeacoffee.com/ohhobby123'

export default function CoffeeDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  useEscapeKey(onClose)
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div
        className="modal coffee-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('coffee.title')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-tt">
          <span>☕ {t('coffee.title')}</span>
          <span className="x" role="button" aria-label={t('coffee.close')} onClick={onClose}>
            ✕
          </span>
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
