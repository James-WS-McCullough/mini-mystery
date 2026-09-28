// Drive a full playthrough of Mini-Mystery (staged flow) in headless Chrome.
//   APP_URL=http://localhost:5174 SHOTS=/tmp node scripts/playthrough.mjs
import { chromium } from 'playwright-core'

const SHOTS = process.env.SHOTS ?? '.'
const shot = async (page, name) => {
  await page.waitForTimeout(900) // let CSS entrance animations settle
  await page.screenshot({
    path: `${SHOTS}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
    timeout: 60_000,
  })
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
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

await page.goto(process.env.APP_URL ?? 'http://localhost:5173')
await page.getByText('MINI').waitFor()

// Start case #7.
await page.fill('input', '7')
await page.click('button:has-text("Take the case")')
await page.getByText('Case №7').waitFor()
await shot(page, '1-intro')

await page.click('button:has-text("Summon the household")')
await page.getByText('The household gathers').waitFor()
await shot(page, '2-gather')
await page.click('button:has-text("Begin the investigation")')

// 8 o'clock transition → search the scene.
await page.getByText('8 o’clock', { exact: false }).first().waitFor()
await shot(page, '3-transition')
await proceed()
await page.getByText('Where will you search this hour?').waitFor()
await shot(page, '4-search')
await page.click('.room.scene')
await page.getByText('On to the questioning').waitFor()
await shot(page, '5-search-result')
await toQuestioning()
await shot(page, '6-suspects')

// Interview a few guests.
const interview = async (nth, asks) => {
  await page.click(`.suspect >> nth=${nth}`)
  for (const label of asks) {
    const btn = page.locator(`button:has-text("${label}")`)
    if (await btn.isEnabled()) await btn.click()
  }
  await page.click('button:has-text("← the household")')
}
await interview(0, ['Where were you?', 'What do you know?'])
await page.click('.suspect >> nth=1')
await page.click('button:has-text("Where were you?")')
await page.click('button:has-text("What do you know?")')
await shot(page, '7-interview')
await page.click('button:has-text("← the household")')
await interview(2, ['Where were you?', 'What do you know?'])

// Close the hour → the deduction menu: try pairing two notes.
await page.click('button:has-text("Close the hour’s questioning")')
await page.getByText('Before the hour strikes…').waitFor()
await shot(page, '8-deduce')
const rows = page.locator('.row.interactive')
if ((await rows.count()) >= 2) {
  // A deliberate wrong pair first (the miss path)…
  await rows.nth(0).click()
  await rows.nth(1).click()
  await page.click('button:has-text("Test the pair")')
  await shot(page, '8b-deduce-miss')
  // …then a real thread (seed 7): the witness's cane glimpse agrees with the
  // cane scuffs at the scene — a corroboration.
  await page.click('.row.interactive:has-text("glimpsed someone near the billiard room")')
  await page.click('.tab:has-text("Evidence")')
  await page.click('.row.interactive:has-text("cane ferrule")')
  await page.click('button:has-text("Test the pair")')
  await shot(page, '8c-deduce-success')
}
await page.click('button:has-text("Let the hour strike")')
await proceed()
await page.getByText('Where will you search this hour?').waitFor()
await page.click('.room:enabled >> nth=0')
await page.getByText('On to the questioning').waitFor()
await toQuestioning()
await interview(3, ['Where were you?', 'What do you know?'])
await interview(4, ['Where were you?', 'What do you know?'])
// Keep two questions in hand for the Press.

// Open the notebook drawer and flip through its tabs.
await page.click('button:has-text("Notebook")')
await page.locator('.drawer').waitFor()
await page.click('.drawer button:has-text("Topics")')
await shot(page, '9-notebook-topics')
await page.click('.drawer button:has-text("Evidence")')
await shot(page, '9b-notebook-evidence')
await page.click('.drawer button:has-text("Threads")')
await shot(page, '9c-notebook-threads')
await page.click('button:has-text("✕")')

// Press anyone flagged with a contradiction.
const flagged = page.locator('.suspect:has-text("contradiction")')
if ((await flagged.count()) > 0) {
  await flagged.first().click()
  const pressBtn = page.locator('button:has-text("Press them")')
  if ((await pressBtn.count()) > 0 && (await pressBtn.isEnabled())) {
    await pressBtn.click()
    await shot(page, '10-pressed')
  }
  await page.click('button:has-text("← the household")')
}

// Accuse the Colonel (the true culprit for seed 7), building the case on the board.
await page.click('button:has-text("Accuse")')
await page.getByText('The Accusation').waitFor()
await page.click('.board .suspect:has-text("the Colonel")')
const boxes = page.locator('.cite input[type=checkbox]')
const n = Math.min(await boxes.count(), 6)
for (let i = 0; i < n; i++) {
  // Plain click, no assertion — the cite cap may legitimately refuse the toggle.
  await boxes.nth(i).click()
}
await shot(page, '11-accuse')

await page.click('button:has-text("Point the finger")')
await page.getByText(/Airtight Case|Strong Case|Lucky Finger|Wrong Name/).waitFor()
await shot(page, '12-reveal')

console.log('PLAYTHROUGH OK')
console.log('page errors:', errors.length === 0 ? 'none' : errors.join('\n'))
await browser.close()
