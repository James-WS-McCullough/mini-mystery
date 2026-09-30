// Drive a full playthrough of Mini-Mystery (staged flow) in headless Chrome.
//   APP_URL=http://localhost:5174 SHOTS=/tmp node scripts/playthrough.mjs
// Set GUIDANCE=1 to leave Sergeant Pike's first-night advice switched on.
import { chromium } from 'playwright-core'

const SHOTS = process.env.SHOTS ?? '.'
const URL = process.env.APP_URL ?? 'http://localhost:5173'
const shot = async (page, name) => {
  await page.waitForTimeout(900) // let entrance animations settle
  await page.screenshot({
    path: `${SHOTS}/${name}.png`,
    animations: 'disabled',
    timeout: 60_000,
  })
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript((guidance) => {
  if (localStorage.getItem('mini-mystery:profile') === null) {
    localStorage.setItem('mini-mystery:profile', JSON.stringify({ guidance }))
    localStorage.setItem('mini-mystery:settings', JSON.stringify({ textSpeed: 'fast' }))
  }
}, process.env.GUIDANCE === '1')
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const proceed = async () => {
  await page.click('.transition')
}
const toQuestioning = async () => {
  await page.click('button:has-text("On to the questioning")')
  await page.getByText('Whom will you question?').waitFor()
}
const closeOverlay = async () => {
  await page.click('[role=dialog] button[aria-label="Close"]')
  await page.locator('[role=dialog]').waitFor({ state: 'detached' })
}

await page.goto(URL)
await page.locator('p.where').waitFor()
await shot(page, '0-title')

// Start case #7.
await page.fill('input[inputmode=numeric]', '7')
await page.click('button:has-text("Take a new case")')
await page.getByText('Case №7').waitFor()
await shot(page, '1-intro')

// The gathering.
await page.click('button:has-text("Summon the household")')
await page.getByText('The household gathers').waitFor()
await shot(page, '2-gather')
// Each guest is introduced in turn; the first click finishes the line, the
// second moves on.
while (!(await page.locator('button:has-text("Begin the investigation")').count())) {
  await page.click('[data-next]')
  await page.waitForTimeout(350)
}
await shot(page, '2b-gather-last')
// The first click finishes the line if it is still being typed.
while (!(await page.locator('.transition').count())) {
  await page.click('button:has-text("Begin the investigation")', { timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(350)
}

// The case's title card, then the 8 o'clock transition → search the scene.
await page.locator('.case-title').waitFor()
await shot(page, '2c-title-card')
await page.click('.transition')
await page.getByText('8 o’clock', { exact: false }).first().waitFor()
await shot(page, '3-transition')
await proceed()
await page.getByText('Where will you search this hour?').waitFor()
await shot(page, '4-search')
await page.click('button.room.scene')
await page.getByText('On to the questioning').waitFor()
await shot(page, '5-search-result')
await toQuestioning()
// Striking a guest off is the detective's own doing, and can be undone.
await page.click('.suspect >> nth=6 >> button.strike')
await page.click('.suspect >> nth=5 >> button.strike')
await page.click('.suspect >> nth=5 >> button.strike')
// Who they are is the detective's own to write, too.
await page.click('.suspect >> nth=0 >> button.role-mark')
await page.click('.pop-menu button:has-text("the Loner")')
await shot(page, '6-suspects')

// Interview the guests: everyone who can be reached this hour gives their account.
const ask = async (label) => {
  const btn = page.locator(`.choice:has-text("${label}")`)
  if (await btn.isEnabled()) await btn.click()
}
const interview = async (nth, asks) => {
  await page.click(`.suspect >> nth=${nth} >> button.sit`)
  await page.locator('.interview').waitFor()
  for (const label of asks) await ask(label)
  await page.click('button:has-text("the household")')
  await page.locator('.suspects').waitFor()
}
await interview(0, ['Where were you?'])
await page.click('.suspect >> nth=1 >> button.sit')
await ask('Where were you?')
await shot(page, '7-interview')
await page.click('.choice:has-text("Show evidence")')
await shot(page, '7c-show-evidence')
await page.click('.picker button:has-text("back")')
await page.click('button:has-text("the household")')
for (const nth of [2, 3, 4, 5]) await interview(nth, ['Where were you?'])

// The plan of the house, with everyone pinned where the notes put them.
await page.click('button:has-text("Plan")')
await page.locator('[role=dialog]').waitFor()
await page.click('[role=dialog] button.room.scene')
await shot(page, '7d-plan')
await closeOverlay()

// Compare notes → the deduction table: try pairing two notes.
await page.click('button.compare')
await page.getByText('Your notes, side by side').waitFor()
await shot(page, '8-deduce')
const cards = page.locator('button.note-card')
if ((await cards.count()) >= 2) {
  // A deliberate wrong pair first (the miss path)…
  await cards.nth(0).click()
  await cards.nth(1).click()
  await page.click('button:has-text("Test the pair")')
  await shot(page, '8b-deduce-miss')
  // …then a real thread, if the hour's accounts hold one: two guests who
  // each put the other beside them in the same room — a mutual alibi.
  const accounts = await page.locator('button.note-card').evaluateAll((cards) =>
    cards.map((c, i) => ({ i, text: c.textContent ?? '' })),
  )
  const together = accounts
    .map((a) => ({ ...a, room: /was in (the [a-z ]+?) with /.exec(a.text)?.[1] }))
    .filter((a) => a.room)
  const first = together.find((a) => together.some((b) => b.i !== a.i && b.room === a.room))
  if (first) {
    const second = together.find((b) => b.i !== first.i && b.room === first.room)
    await cards.nth(first.i).click()
    await cards.nth(second.i).click()
  } else {
    await cards.nth(0).click()
    await cards.nth(2).click()
  }
  await page.click('button:has-text("Test the pair")')
  await shot(page, '8c-deduce-success')
}
await page.click('#action-bar button:has-text("Back to the household")')
await page.getByText('Whom will you question?').waitFor()
await page.click('button:has-text("Let the hour strike")')
// Asked twice, if there are questions in hand.
if (await page.locator('button:has-text("Let it strike")').count()) {
  await page.click('button:has-text("Let it strike")')
}
await proceed()
await page.getByText('Where will you search this hour?').waitFor()
await page.click('button.room >> nth=0')
await page.getByText('On to the questioning').waitFor()
await toQuestioning()
await interview(6, ['Where were you?', 'Who are you, and what do you know?'])
await interview(0, ['Who are you, and what do you know?', 'Whom do you suspect?'])
// Keep two questions in hand for the Press.

// Open the notebook and flip through its tabs.
await page.click('button:has-text("Notebook")')
await page.locator('[role=dialog]').waitFor()
await page.click('[role=dialog] .tab:has-text("Topics")')
await shot(page, '9-notebook-topics')
await page.click('[role=dialog] .tab:has-text("Evidence")')
await shot(page, '9b-notebook-evidence')
await page.click('[role=dialog] .tab:has-text("Threads")')
await shot(page, '9c-notebook-threads')
await closeOverlay()

// Press anyone flagged with a contradiction.
const flagged = page.locator('.suspect.flagged')
if ((await flagged.count()) > 0) {
  await flagged.first().locator('button.sit').click()
  const pressBtn = page.locator('.choice:has-text("Press them")')
  if ((await pressBtn.count()) > 0 && (await pressBtn.isEnabled())) {
    await pressBtn.click()
    await shot(page, '10-pressed')
  }
  await page.click('button:has-text("the household")')
}

// A saved night survives a reload: leave, come back, continue.
await page.reload()
await page.click('button:has-text("Continue case №7")')
await page.getByText('Whom will you question?').waitFor()

// Accuse somebody, building the case on the board. (Whether it is the right
// name is the engine's business; the reveal must play out either way.)
await page.click('button:has-text("Accuse")')
await page.click('[data-confirm]')
// The household is called together, and each has a word to say first.
await page.locator('.called').waitFor()
await shot(page, '10b-called')
while (await page.locator('.called').count()) {
  await page.click('[data-next]')
  await page.waitForTimeout(300)
}
await page.locator('.accuse').waitFor()
await page.click('.lineup .suspect >> nth=6')
await page.click('.cite .tab:has-text("Evidence")')
const exhibits = page.locator('.cite button.note-card')
const n = Math.min(await exhibits.count(), 6)
for (let i = 0; i < n; i++) {
  // Plain click, no assertion — the cite cap may legitimately refuse the pin.
  await exhibits.nth(i).click()
}
await shot(page, '11-accuse')

await page.click('button:has-text("Point the finger")')
await page.locator('.theatre').waitFor()
await shot(page, '12-reveal-point')
await page.click('[data-skip]')
await page.getByText(/Airtight Case|Strong Case|Lucky Finger|Wrong Name/).first().waitFor()
await shot(page, '13-reveal-truth')

console.log('PLAYTHROUGH OK')
console.log('page errors:', errors.length === 0 ? 'none' : errors.join('\n'))
await browser.close()
