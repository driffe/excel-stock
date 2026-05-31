/* eslint-disable react-refresh/only-export-components -- context module also exports a hook + helper */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from '../types'
import { en, type TranslationKey } from './en'
import { ko } from './ko'

const DICTS: Record<Lang, Record<TranslationKey, string>> = { en, ko }
const LS_LANG = 'excelstock_lang'

type Params = Record<string, string | number>

export interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
  /** Translate a key, interpolating {tokens} from params. */
  t: (key: TranslationKey, params?: Params) => string
}

const I18nContext = createContext<I18n | null>(null)

function loadLang(): Lang {
  const saved = localStorage.getItem(LS_LANG)
  return saved === 'ko' || saved === 'en' ? saved : 'en' // default English
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`,
  )
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)

  useEffect(() => {
    localStorage.setItem(LS_LANG, lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggleLang = useCallback(
    () => setLangState((l) => (l === 'en' ? 'ko' : 'en')),
    [],
  )
  const t = useCallback(
    (key: TranslationKey, params?: Params) =>
      interpolate(DICTS[lang][key] ?? key, params),
    [lang],
  )

  const value = useMemo<I18n>(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** Relative time label (e.g. "8m ago" / "8분 전") from an epoch-ms timestamp. */
export function relTime(datetime: number, t: I18n['t']): string {
  const mins = Math.max(0, Math.round((Date.now() - datetime) / 60000))
  if (mins < 1) return t('time.now')
  if (mins < 60) return t('time.min', { n: mins })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('time.hour', { n: hours })
  return t('time.day', { n: Math.round(hours / 24) })
}
