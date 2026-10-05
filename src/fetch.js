// fetch.js — download a page and pull out its heading structure.
// This is the part that replaces "open 20 tabs and squint at them".

import * as cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (compatible; OutlineResearcher/1.0; +https://github.com/realaweayomide)'

// Headings that are navigation, CTAs or newsletter boilerplate rather than content.
// Patterns beat an exact-match list here — real pages say "Thank you! You are subscribed."
// and "The latest tech news, backed by expert insights", which no fixed list would catch.
const JUNK_PATTERNS = [
  /^(menu|navigation|search|footer|resources|categories|tags|archives|comments?|share this)$/i,
  /thank you/i,
  /subscrib/i,          // subscribe / subscribed / subscription
  /newsletter/i,
  /sign\s?up/i,
  /^(get started|try |start your|book a|request a|download)/i,
  /latest (tech |industry )?news/i,
  /follow us|contact us|about us/i,
  /related (posts|articles|reading)/i,
  /(recent|popular) posts/i,
  /table of contents/i,
  /leave a comment/i,
  /expert insights/i,
]

const isJunk = (text) => JUNK_PATTERNS.some((p) => p.test(text))

export async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const type = res.headers.get('content-type') || ''
  if (!type.includes('html')) throw new Error(`not an HTML page (${type.split(';')[0]})`)

  const $ = cheerio.load(await res.text())
  $('script, style, noscript, svg').remove()

  const headings = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (!text || text.length < 3 || text.length > 160) return
    if (isJunk(text)) return
    headings.push({ level: Number(el.tagName[1]), text })
  })

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  return {
    url,
    title: ($('meta[property="og:title"]').attr('content') || $('title').text() || '').trim(),
    description: ($('meta[name="description"]').attr('content') || '').trim(),
    headings: dedupe(headings),
    wordCount: bodyText ? bodyText.split(' ').length : 0,
  }
}

/** Fetch every URL in parallel. A dead page warns but never kills the run. */
export async function fetchAll(urls) {
  const settled = await Promise.allSettled(urls.map(fetchPage))
  const pages = []
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') pages.push(r.value)
    else console.warn(`  ⚠  skipped ${urls[i]} — ${r.reason?.message || r.reason}`)
  })
  return pages
}

function dedupe(headings) {
  const seen = new Set()
  return headings.filter((h) => {
    const key = h.text.toLowerCase()
    return seen.has(key) ? false : seen.add(key)
  })
}
