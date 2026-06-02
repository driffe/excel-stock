import { describe, it, expect } from 'vitest'
import { parseRssFeed } from './rssNews'

// Trimmed but faithful to live Google News RSS output (entities, " - Publisher"
// title suffix, redirect <link>, <source url>, re-linked <description>).
const FEED = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>
<title>Google News</title>
<item>
<title>Stock market today: Dow, S&amp;P 500 climb to record highs - Yahoo Finance</title>
<link>https://news.google.com/rss/articles/CBMiABC123?oc=5</link>
<guid isPermaLink="false">CBMiABC123</guid>
<pubDate>Sun, 31 May 2026 13:25:00 GMT</pubDate>
<description>&lt;a href="https://news.google.com/rss/articles/CBMiABC123?oc=5"&gt;Stock market today&lt;/a&gt;</description>
<source url="https://finance.yahoo.com">Yahoo Finance</source>
</item>
<item>
<title>Barron&#39;s says Nvidia is still cheap - Barron&#39;s</title>
<link>https://news.google.com/rss/articles/CBMiXYZ789?oc=5</link>
<guid isPermaLink="false">CBMiXYZ789</guid>
<pubDate>Sat, 30 May 2026 09:00:00 GMT</pubDate>
<description>&lt;a href="x"&gt;Barron's&lt;/a&gt;</description>
<source url="https://www.barrons.com">Barron's</source>
</item>
</channel></rss>`

describe('parseRssFeed', () => {
  it('parses items, excluding the channel title', () => {
    const items = parseRssFeed(FEED)
    expect(items).toHaveLength(2)
    expect(items.some((i) => i.headline === 'Google News')).toBe(false)
  })

  it('decodes entities and strips the " - Publisher" suffix from titles', () => {
    const [a, b] = parseRssFeed(FEED)
    expect(a.headline).toBe('Stock market today: Dow, S&P 500 climb to record highs')
    // apostrophe (&#39;) decoded, and " - Barron's" suffix removed despite the
    // apostrophe appearing in both the title and the source name.
    expect(b.headline).toBe("Barron's says Nvidia is still cheap")
  })

  it('takes source from <source>, keeps the redirect link, and parses the date', () => {
    const [a] = parseRssFeed(FEED)
    expect(a.source).toBe('Yahoo Finance')
    expect(a.url).toBe('https://news.google.com/rss/articles/CBMiABC123?oc=5')
    expect(a.id).toBe('CBMiABC123')
    expect(a.datetime).toBe(Date.parse('Sun, 31 May 2026 13:25:00 GMT'))
    expect(a.related).toEqual([])
  })

  it('leaves summary empty (description is only the re-linked headline)', () => {
    for (const item of parseRssFeed(FEED)) expect(item.summary).toBe('')
  })

  it('returns [] for a feed with no items', () => {
    expect(parseRssFeed('<rss><channel><title>Google News</title></channel></rss>')).toEqual([])
  })
})
