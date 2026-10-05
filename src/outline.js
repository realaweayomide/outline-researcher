// outline.js — optional LLM pass that turns the research into a recommended outline.
// Without a key this returns null and the CLI just prints the research, which is
// still the useful 80%.

const API_KEY = process.env.LLM_API_KEY
const BASE_URL = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'

const SYSTEM = `You are an editor planning an article. You are given a topic and the real heading
structures of competing pages that already rank for it.

Produce a recommended outline in markdown:
- An H1 title suggestion.
- 5-9 H2 sections, in a sensible reading order.
- Under each H2, one line saying what it should cover and why.
- Mark any section that nearly every competitor includes with "(table stakes)".
- End with a short "## Gaps worth owning" section: 2-3 angles the competitors MISSED.

Be specific to this topic. Never invent statistics. Output markdown only, no preamble.`

export async function buildOutline(topic, pages, analysis) {
  if (!API_KEY) return null

  const competitorStructure = pages
    .map((p) => {
      const h2s = p.headings.filter((h) => h.level === 2).map((h) => `  - ${h.text}`).join('\n')
      return `### ${p.title || p.url}\n(${p.wordCount} words)\n${h2s || '  (no H2s found)'}`
    })
    .join('\n\n')

  const commonTerms = analysis.common
    .map((c) => `${c.term} (${c.pages}/${analysis.stats.pages} pages)`)
    .join(', ')

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content:
              `TOPIC: ${topic}\n\n` +
              `AVERAGE LENGTH: ${analysis.stats.avgWordCount} words, ~${analysis.stats.avgH2s} H2 sections\n\n` +
              `TERMS MOST PAGES COVER: ${commonTerms || '(none found)'}\n\n` +
              `COMPETITOR STRUCTURES:\n${competitorStructure}`,
          },
        ],
      }),
    })
    if (!res.ok) throw new Error(`LLM returned ${res.status}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch (err) {
    console.warn(`  ⚠  outline generation failed (${err.message}) — showing research only.`)
    return null
  }
}
