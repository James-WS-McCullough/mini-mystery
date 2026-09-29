// Measures, for each sitter, where the edges of the neck are at each height,
// in the figure's own coordinates — from the drawing itself.
import { chromium } from 'playwright-core'
const ids = process.argv[2]
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1500, height: 900 } })
await p.goto(`http://localhost:5199/portraits.html?size=300&who=${ids}`)
await p.waitForTimeout(900)
const out = await p.evaluate(() => {
  const res = {}
  for (const sec of document.querySelectorAll('section')) {
    const svg = sec.querySelector('svg.portrait')
    const fig = svg.querySelector('g.sitter > g')
    const inks = [...fig.querySelectorAll('path.ink')].filter((el) => !el.classList.contains('line'))
    const figM = fig.getCTM()
    const inside = (x, y) => inks.some((el) => {
      const m = el.getCTM().inverse().multiply(figM)
      const pt = new DOMPoint(x, y).matrixTransform(m)
      return el.isPointInFill(pt)
    })
    const rows = {}
    for (let y = 76; y <= 98; y += 2) {
      // walk out from the middle of the neck
      let cx = 47
      if (!inside(cx, y)) { rows[y] = null; continue }
      let l = cx, r = cx
      while (l > 0 && inside(l - 0.25, y)) l -= 0.25
      while (r < 100 && inside(r + 0.25, y)) r += 0.25
      rows[y] = [l, r]
    }
    res[sec.dataset.who] = rows
  }
  return res
})
for (const [who, rows] of Object.entries(out)) {
  console.log(who.padEnd(10), Object.entries(rows).map(([y, v]) => `${y}:${v ? v[0].toFixed(1) + '-' + v[1].toFixed(1) : 'x'}`).join('  '))
}
await b.close()
