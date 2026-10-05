# Outline Researcher

Give it a topic and a few competing URLs. It reads how each page is actually structured and hands
you a researched outline — so you stop opening twenty tabs before you write a word.

Built by [Ayomide Awe](https://github.com/realaweayomide)

## Why I built this

I spent seven years writing content, and the writing was never the slow part. The slow part was
*before* the writing: opening tab after tab, reading competing pages, trying to work out what
sections and subheadings should even exist, and what everyone else had already covered.

That's a research task with a repeatable shape. So I automated it.

## Try it

```bash
npm install
node src/index.js --topic "workflow automation" --urls https://a.com/post,https://b.com/post
```

No API key needed — the research, the competitor stats and the table-stakes analysis all run
locally. Add a key only if you want the AI-written outline on top.

## What you get

```
────────────────────────────────────────────────────────────
📊  WHAT THE COMPETITION LOOKS LIKE
────────────────────────────────────────────────────────────
   Pages read:      2
   Average length:  2,828 words
   Average H2s:     6

🔑  TABLE STAKES — themes most pages cover:
   ██████████  workflow  (2/2)
   ██████████  automation  (2/2)
   ██████████  process  (2/2)

🗂   EVERY H2 THEY USED:
   • What is workflow automation?   —  zapier.com
   • Why invest in workflow automation?   —  zapier.com
   • Benefits of workflow automation   —  ibm.com
   • Types of workflow automation   —  ibm.com
   ...
```

Three things, in order of usefulness:

1. **Benchmarks** — how long these pieces actually are, and how many sections they use. Now you know what you're competing against.
2. **Table stakes** — themes that show up across *multiple* pages. If 4 of 5 competitors give something a heading, you can't skip it.
3. **Every H2 they used** — the raw structures, attributed, so you can see the patterns yourself.

With an API key it adds a **recommended outline**: H1, 5–9 H2s in reading order, what each should cover, which are table stakes, and a "Gaps worth owning" section of angles the competitors missed.

## How it works

| Step | What happens |
|---|---|
| **Fetch** | All URLs in parallel. A dead page warns and is skipped — it never kills the run. |
| **Extract** | Cheerio pulls `h1/h2/h3`, title, meta description, word count. Navigation, CTA and newsletter headings are filtered out by pattern (real pages are full of *"Thank you! You are subscribed."*). |
| **Analyze** | Document-frequency counting across pages — pure logic, no LLM. A term mentioned by 2+ pages is table stakes. |
| **Outline** | *(optional)* An LLM turns the research into a recommended structure. |

## Options

| Flag | Meaning |
|---|---|
| `--topic "<topic>"` | **Required.** What you're writing about. |
| `--urls a,b,c` | Comma-separated competitor URLs. |
| `--file urls.txt` | ...or one URL per line in a file (`#` comments allowed). |
| `--out outline.md` | Also save everything to a markdown file. |

## Design note

The LLM is the *last* step, not the first. Everything genuinely useful — the benchmarks, the shared
themes, the real heading structures — is computed from the actual pages with no model involved.
The AI adds judgement on top of real research rather than inventing an outline from nothing.

That's also why it works with no API key.

## Project structure

```
outline-researcher/
├── src/
│   ├── index.js     # CLI + report rendering
│   ├── fetch.js     # fetch pages, extract headings, filter junk
│   ├── analyze.js   # table-stakes analysis (no LLM)
│   └── outline.js   # optional LLM synthesis
├── .env.example
└── package.json
```

## License

MIT
