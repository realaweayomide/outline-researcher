// outline-researcher — the "20 tabs before I write a word" problem, automated.
//
//   node src/index.js --topic "workflow automation" --urls url1,url2,url3
//   node src/index.js --topic "..." --file urls.txt --out outline.md

import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fetchAll } from './fetch.js'
import { analyze } from './analyze.js'
import { buildOutline } from './outline.js'

const args = parseArgs(process.argv.slice(2))

if (!args.topic || (!args.urls && !args.file)) {
  console.log(`
outline-researcher — turn competing pages into a researched article outline

  --topic "<your topic>"      required
  --urls  url1,url2,url3      comma-separated competitor URLs
  --file  urls.txt            ...or one URL per line in a file
  --out   outline.md          also save the result to a file

Example:
  node src/index.js --topic "workflow automation" --urls https://a.com/x,https://b.com/y
`)
  process.exit(args.topic ? 1 : 0)
}

const urls = args.file ? readUrlFile(args.file) : args.urls.split(',').map((u) => u.trim()).filter(Boolean)

console.log(`\n🔎  Topic: ${args.topic}`)
console.log(`📄  Reading ${urls.length} page(s)…\n`)

const pages = await fetchAll(urls)

if (!pages.length) {
  console.error('❌  Could not read any of those pages.')
  process.exit(1)
}

const analysis = analyze(pages)
let report = renderResearch(pages, analysis)

console.log(report)

console.log('🤖  Building recommended outline…\n')
const outline = await buildOutline(args.topic, pages, analysis)

if (outline) {
  console.log(outline + '\n')
  report += `\n\n# Recommended outline\n\n${outline}\n`
} else {
  console.log('   (no LLM_API_KEY set — research above is still yours to use)\n')
}

if (args.out) {
  writeFileSync(args.out, `# Research: ${args.topic}\n\n${report}`, 'utf8')
  console.log(`💾  Saved to ${args.out}\n`)
}

// ---------- helpers ----------

function renderResearch(pages, { common, allHeadings, stats }) {
  const L = []
  L.push('─'.repeat(60))
  L.push(`📊  WHAT THE COMPETITION LOOKS LIKE`)
  L.push('─'.repeat(60))
  L.push(`   Pages read:      ${stats.pages}`)
  L.push(`   Average length:  ${stats.avgWordCount.toLocaleString()} words`)
  L.push(`   Average H2s:     ${stats.avgH2s}`)
  L.push('')

  if (common.length) {
    L.push('🔑  TABLE STAKES — themes most pages cover:')
    for (const c of common.slice(0, 12)) {
      const bar = '█'.repeat(Math.round(c.share * 10)).padEnd(10, '·')
      L.push(`   ${bar}  ${c.term}  (${c.pages}/${stats.pages})`)
    }
    L.push('')
  }

  L.push('🗂   EVERY H2 THEY USED:')
  for (const h of allHeadings.slice(0, 40)) {
    L.push(`   • ${h.text}   —  ${h.from}`)
  }
  L.push('')
  return L.join('\n')
}

function readUrlFile(path) {
  if (!existsSync(path)) {
    console.error(`❌  File not found: ${path}`)
    process.exit(1)
  }
  return readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i]
  }
  return out
}
