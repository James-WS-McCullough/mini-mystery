// The Architect: knows where the secret passage from the scene leads.
import type { InfoPart } from './part'

export const architect: InfoPart = {
  knows({ passageRoom }) {
    return passageRoom !== null ? { kind: 'passage', room: passageRoom } : null
  },
  fabricate({ rng, passage }) {
    // A passage, and to the wrong room.
    const wrong = (passage?.rooms ?? []).filter((r) => r !== passage?.truly)
    if (wrong.length === 0) return null
    return { kind: 'passage', room: rng.pick(wrong) }
  },
  careful({ passageRoom }) {
    return { kind: 'passage', room: passageRoom! }
  },
}
