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
  await page.click('button:has-text("proceed")')
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
await page.getByText('Blackwood Manor, 1926').waitFor()
await shot(page, '0-title')

// Start case #7.
await page.fill('input[inputmode=numeric]', '7')
await page.click('button:has-text("Take a new case")')
await page.getByText('Case №7').waitFor()
await shot(page, '1-intro')

// The gathering: hear the first guest out, then the rest at once.
await page.click('button:has-text("Summon the household")')
await page.getByText('The household gathers').waitFor()
await shot(page, '2-gather')
await page.click('button:has-text("Next")')
await page.click('button:has-text("Hear them all at once")')
await shot(page, '2b-gather-all')
await page.click('button:has-text("Begin the investigation")')

// 8 o'clock transition → search the scene on the plan of the house.
await page.getByText('8 o’clock', { exact: false }).first().waitFor()
await shot(page, '3-transition')
await proceed()
await page.getByText('Where will you search this hour?').waitFor()
await shot(page, '4-search')
await page.click('button.room.scene')
await page.getByText('On to the questioning').waitFor()
await shot(page, '5-search-result')
await toQuestioning()
await shot(page, '6-suspects')

// Interview a few guests.
const ask = async (label) => {
  const btn = page.locator(`.choice:has-text("${label}")`)
  if (await btn.isEnabled()) await btn.click()
}
const interview = async (nth, asks) => {
  await page.click(`.suspect >> nth=${nth}`)
  await page.locator('.interview').waitFor()
  for (const label of asks) await ask(label)
  await page.click('button:has-text("the household")')
  await page.locator('.suspects').waitFor()
}
await interview(0, ['Where were you?', 'What do you know?'])
await page.click('.suspect >> nth=1')
await ask('Where were you?')
await ask('What do you know?')
await shot(page, '7-interview')
await page.click('.choice:has-text("Ask about someone")')
await shot(page, '7b-ask-about')
await page.click('.picker button:has-text("back")')
await page.click('.choice:has-text("Show evidence")')
await shot(page, '7c-show-evidence')
await page.click('.picker button:has-text("back")')
await page.click('button:has-text("the household")')
await interview(3, ['Where were you?', 'What do you know?'])

// The plan of the house, with everyone pinned where the notes put them.
await page.click('button:has-text("Plan")')
await page.locator('[role=dialog]').waitFor()
await page.click('[role=dialog] button.room.scene')
await shot(page, '7d-plan')
await closeOverlay()

// Close the hour → the deduction table: try pairing two notes.
await page.click('button.close-hour')
await page.getByText('Before the hour strikes…').waitFor()
await shot(page, '8-deduce')
const cards = page.locator('button.note-card')
if ((await cards.count()) >= 2) {
  // A deliberate wrong pair first (the miss path)…
  await cards.nth(0).click()
  await cards.nth(1).click()
  await page.click('button:has-text("Test the pair")')
  await shot(page, '8b-deduce-miss')
  // …then a real thread (seed 7): the witness's glimpse of someone gloved
  // agrees with the torn glove at the scene — a corroboration.
  await page.click('button.note-card:has-text("glimpsed someone near the conservatory")')
  await page.click('.tab:has-text("Evidence")')
  await page.click('button.note-card:has-text("kid glove")')
  await page.click('button:has-text("Test the pair")')
  await shot(page, '8c-deduce-success')
}
await page.click('button:has-text("Let the hour strike")')
await proceed()
await page.getByText('Where will you search this hour?').waitFor()
await page.click('button.room >> nth=0')
await page.getByText('On to the questioning').waitFor()
await toQuestioning()
await interview(2, ['Where were you?', 'What do you know?'])
await interview(4, ['Where were you?', 'What do you know?'])
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
  await flagged.first().click()
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

// Accuse Mr. Trent (the true culprit for seed 7), building the case on the board.
await page.click('button:has-text("Accuse")')
await page.click('[data-confirm]')
await page.locator('.accuse').waitFor()
await page.click('.lineup .suspect:has-text("Mr. Trent")')
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
