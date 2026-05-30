import type { Lang, NewsItem } from '../types'

/**
 * A news provider fetches market + company news, normalized to NewsItem[].
 * Implementations live alongside this file (news.ts mock, finnhubNews.ts) and
 * are selected at startup by getNewsProvider() based on Vite env vars.
 *
 * `lang` is a hint: the mock provider returns localized fabricated headlines;
 * live providers (Finnhub) ignore it and return source-language (English) text.
 */
export interface NewsProvider {
  readonly name: string
  getMarketNews(lang?: Lang): Promise<NewsItem[]>
  getCompanyNews(symbols: string[], lang?: Lang): Promise<NewsItem[]>
}

interface MockNews {
  id: string
  source: string
  /** Minutes ago, used to derive a stable-ish datetime. */
  minsAgo: number
  related: string[]
  head: { en: string; ko: string }
  sum: { en: string; ko: string }
  url: string
}

// Fabricated, plausible financial-press headlines (bilingual) for offline/demo.
const MOCK_NEWS: MockNews[] = [
  {
    id: 'n1', source: 'Bloomberg', minsAgo: 8, related: ['NVDA'], url: 'https://www.bloomberg.com/technology',
    head: { en: 'Nvidia surges as AI datacenter demand lifts price targets across major banks', ko: '엔비디아, AI 데이터센터 수요 폭증… 주요 IB 목표주가 줄상향' },
    sum: { en: 'Goldman and Morgan Stanley raised targets, citing strong datacenter GPU demand.', ko: '골드만·모건스탠리 등이 데이터센터 GPU 수요 호조를 근거로 목표가를 일제히 상향.' },
  },
  {
    id: 'n3', source: 'Investing.com', minsAgo: 19, related: ['QQQ'], url: 'https://www.investing.com',
    head: { en: 'Nasdaq-100 ETF posts record volume on a tech-led rally', ko: '기술주 랠리에 나스닥100 ETF 사상 최대 거래량 기록' },
    sum: { en: 'QQQ turnover hit a yearly high as chipmakers and big tech powered higher.', ko: '반도체·빅테크 강세에 QQQ 거래대금이 올해 최고치를 경신했다.' },
  },
  {
    id: 'n4', source: 'Reuters', minsAgo: 23, related: ['AAPL'], url: 'https://www.reuters.com/technology',
    head: { en: 'Apple draws institutional buying ahead of next-gen on-device AI reveal', ko: '애플, 차세대 온디바이스 AI 공개 앞두고 기관 매수세 유입' },
    sum: { en: 'Net institutional buying continued on WWDC anticipation, nearing record highs.', ko: 'WWDC 신기능 기대감에 기관 순매수가 이어지며 사상 최고가에 근접.' },
  },
  {
    id: 'n6', source: 'Reuters', minsAgo: 35, related: ['TSLA'], url: 'https://www.reuters.com/business',
    head: { en: 'Tesla slips intraday on worries the robotaxi launch could be delayed', ko: '테슬라, 로보택시 출시 지연 우려에 장중 약세로 전환' },
    sum: { en: 'Reports that the robotaxi unveiling may slip weighed on sentiment.', ko: '로보택시 공개 일정이 미뤄질 수 있다는 보도에 투자심리가 위축됐다.' },
  },
  {
    id: 'n7', source: 'CNBC', minsAgo: 47, related: ['META'], url: 'https://www.cnbc.com/markets',
    head: { en: 'Meta cheered by analysts after raising ad-revenue guidance', ko: '메타, 광고 매출 가이던스 상향에 애널리스트 일제히 환호' },
    sum: { en: 'Improved AI ad-recommendation efficiency lifted next-quarter revenue outlook.', ko: 'AI 추천 광고 효율 개선으로 다음 분기 매출 전망이 상향됐다.' },
  },
  {
    id: 'n9', source: 'Reuters', minsAgo: 61, related: ['SPY'], url: 'https://www.reuters.com/markets',
    head: { en: 'S&P 500 sets a fresh record on a strong May jobs report', ko: '美 5월 고용 호조에 S&P500 사상 최고치 재돌파' },
    sum: { en: 'Nonfarm payrolls beat expectations, boosting soft-landing hopes.', ko: '비농업 고용이 예상을 웃돌며 연착륙 기대가 커졌다.' },
  },
  {
    id: 'n10', source: 'Bloomberg', minsAgo: 64, related: ['AVGO'], url: 'https://www.bloomberg.com/markets',
    head: { en: 'Broadcom firms up on wider big-tech custom AI-chip orders', ko: '브로드컴, 빅테크 AI 맞춤형 칩 수주 확대 소식에 강세' },
    sum: { en: 'Analysts point to growing custom-ASIC orders from large cloud providers.', ko: '대형 클라우드 업체향 맞춤형 ASIC 수주가 늘었다는 분석.' },
  },
  {
    id: 'n11', source: 'CNBC', minsAgo: 78, related: ['GOOGL'], url: 'https://www.cnbc.com/markets',
    head: { en: 'Alphabet sees profit-taking as antitrust risk comes into focus', ko: '알파벳, 반독점 소송 리스크 부각에 차익 실현 매물 출회' },
    sum: { en: 'Short-term profit-taking emerged ahead of a search antitrust ruling.', ko: '검색 반독점 판결을 앞두고 단기 차익 매물이 출회됐다.' },
  },
  {
    id: 'n12', source: 'CNBC', minsAgo: 96, related: [], url: 'https://www.cnbc.com/markets',
    head: { en: "Fed official urges caution on cuts, trimming September rate-cut bets", ko: "연준 위원 '금리 인하 신중해야'… 9월 인하 기대 일부 후퇴" },
    sum: { en: 'Hawkish remarks slightly narrowed expectations for cuts this year.', ko: '매파적 발언에 연내 금리 인하 폭 전망이 소폭 축소됐다.' },
  },
  {
    id: 'n13', source: 'Reuters', minsAgo: 112, related: ['AMZN'], url: 'https://www.reuters.com/technology',
    head: { en: 'Amazon AWS accelerates generative-AI revenue, cloud share rebounds', ko: '아마존 AWS, 생성형 AI 매출 가속… 클라우드 점유율 반등' },
    sum: { en: 'Fast-growing generative-AI services helped cloud market share recover.', ko: '생성형 AI 서비스 매출이 빠르게 늘며 클라우드 점유율이 반등.' },
  },
]

/** Offline/demo news: bilingual fabricated headlines. Runs with zero config. */
export class MockNewsProvider implements NewsProvider {
  readonly name = 'mock'

  private toItem(n: MockNews, lang: Lang): NewsItem {
    return {
      id: n.id,
      headline: n.head[lang],
      summary: n.sum[lang],
      source: n.source,
      url: n.url,
      datetime: Date.now() - n.minsAgo * 60_000,
      related: n.related,
      category: 'general',
    }
  }

  async getMarketNews(lang: Lang = 'en'): Promise<NewsItem[]> {
    return MOCK_NEWS.map((n) => this.toItem(n, lang))
  }

  async getCompanyNews(symbols: string[], lang: Lang = 'en'): Promise<NewsItem[]> {
    const set = new Set(symbols.map((s) => s.toUpperCase()))
    return MOCK_NEWS.filter((n) => n.related.some((t) => set.has(t))).map((n) =>
      this.toItem(n, lang),
    )
  }
}
