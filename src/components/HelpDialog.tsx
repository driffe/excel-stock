import { useState } from 'react'
import { useI18n } from '../i18n'
import { useEscapeKey } from '../hooks/useEscapeKey'

const HELP_EMAIL = 'ohhobby123@gmail.com'

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  useEscapeKey(onClose)

  function handleSend() {
    const url =
      'mailto:' +
      HELP_EMAIL +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body)
    window.location.href = url
    onClose()
  }

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <div
        className="modal help-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('help.title')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-tt">
          <span>? {t('help.title')}</span>
          <span className="x" role="button" aria-label={t('help.cancel')} onClick={onClose}>
            ✕
          </span>
        </div>
        <div className="modal-body">
          <div className="fld">
            <label>{t('help.subjectLabel')}</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('help.subjectPlaceholder')}
              autoFocus
            />
          </div>
          <div className="fld">
            <label>{t('help.bodyLabel')}</label>
            <textarea
              className="help-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('help.bodyPlaceholder')}
              rows={6}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>{t('help.cancel')}</button>
          <button className="btn primary" onClick={handleSend} disabled={!subject.trim()}>
            {t('help.send')}
          </button>
        </div>
      </div>
    </div>
  )
}
