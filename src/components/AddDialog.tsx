import { useState } from 'react'
import { useI18n } from '../i18n'

interface AddDialogProps {
  sheetName: string
  onClose: () => void
  onAdd: (ticker: string) => void
}

/**
 * Add-stock dialog. With live quotes, the user only supplies a ticker symbol —
 * price/change come from the provider (unlike the prototype, which typed them in).
 */
export default function AddDialog({ sheetName, onClose, onAdd }: AddDialogProps) {
  const { t } = useI18n()
  const [ticker, setTicker] = useState('')

  function submit() {
    const v = ticker.trim()
    if (!v) return
    onAdd(v)
  }

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-tt">
          {t('add.title', { sheet: sheetName })}
          <span className="x" onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          <div className="fld">
            <label>{t('add.tickerLabel')}</label>
            <input
              autoFocus
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder={t('add.tickerPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') onClose()
              }}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            {t('add.cancel')}
          </button>
          <button className="btn primary" onClick={submit}>
            {t('add.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
