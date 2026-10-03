import { describe, expect, it } from 'vitest'
import { checkScript } from '../../src/engine/checkScript'
import { SIMPLE_SCRIPT, TWIST_SCRIPT } from '../../src/engine/deck'
import { deleteEvening, evenings, saveEvening } from '../../src/ui/evenings'

describe('evenings of your own', () => {
  it('are kept as Custom scripts, changed in place, the latest first; and forgotten', () => {
    const plain = saveEvening('  Quiet Night  ', SIMPLE_SCRIPT)
    const odd = saveEvening('', { ...TWIST_SCRIPT, suspiciousCount: 3 })
    expect(odd).not.toBe(plain)
    expect(evenings.value.map((e) => e.id)).toEqual(expect.arrayContaining([plain, odd]))
    const quiet = evenings.value.find((e) => e.id === plain)!
    expect(quiet.name).toBe('Quiet Night')
    expect(quiet.script.id).toBe('custom')
    expect(checkScript(quiet.script)).toEqual([])
    expect(evenings.value.find((e) => e.id === odd)!.name).toBe('An evening')

    // Saved over, it keeps its id and is not doubled.
    saveEvening('Quieter Night', { ...SIMPLE_SCRIPT, questionsPerRound: 5 }, plain)
    expect(evenings.value.filter((e) => e.id === plain)).toHaveLength(1)
    expect(evenings.value[0].id).toBe(plain)
    expect(evenings.value[0].script.questionsPerRound).toBe(5)

    deleteEvening(plain)
    deleteEvening(odd)
    expect(evenings.value.some((e) => e.id === plain || e.id === odd)).toBe(false)
  })
})
