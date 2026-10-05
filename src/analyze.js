// analyze.js — works out what every page agrees on, with no LLM involved.
//
// The useful signal isn't "what did page 3 say" — it's "what did ALL of them
// bother to cover?" Anything 2+ competitors give a heading to is table stakes
// for your piece. This is pure counting, so it works with zero API keys.

const STOPWORDS = new Set([
  'the','a','an','and','or','but','for','to','of','in','on','at','is','are','was','were','be',
  'with','by','from','as','it','its','this','that','these','those','your','you','we','our','us',
  'how','what','why','when','where','which','who','can','do','does','should','will','would',
  'about','into','than','then','so','if','not','no','vs','best','top','guide','complete','ultimate',
  // generic verbs/nouns that appear everywhere and tell you nothing
  'use','uses','using','used','get','make','need','way','ways','more','most','new','also','out',
])

/**
 * @param {Array} pages  output of fetchAll()
 * @returns {{common: Array, allHeadings: Array, stats: object}}
 */
export function analyze(pages) {
  // document frequency: how many separate pages mention each keyword in a heading?
  const docFreq = new Map()

  for (const page of pages) {
    const seenHere = new Set()
    for (const h of page.headings) {
      for (const token of tokenize(h.text)) {
        if (seenHere.has(token)) continue
        seenHere.add(token)
        docFreq.set(token, (docFreq.get(token) || 0) + 1)
      }
    }
  }

  const common = [...docFreq.entries()]
    .filter(([, count]) => count >= 2) // mentioned by at least 2 pages
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term, count]) => ({ term, pages: count, share: count / pages.length }))

  const allHeadings = pages.flatMap((p) =>
    p.headings.filter((h) => h.level === 2).map((h) => ({ text: h.text, from: hostname(p.url) }))
  )

  const counts = pages.map((p) => p.wordCount).filter(Boolean)
  const stats = {
    pages: pages.length,
    avgWordCount: counts.length ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0,
    avgH2s: pages.length
      ? Math.round(pages.reduce((n, p) => n + p.headings.filter((h) => h.level === 2).length, 0) / pages.length)
      : 0,
  }

  return { common, allHeadings, stats }
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}
