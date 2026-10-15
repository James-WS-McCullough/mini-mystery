// The Socialite: knows everybody's diary, who is in town and who is not. Names
// one part that is here tonight, and one that is not: whoever says they are
// that one is not what they say. Most often the part somebody is passing for.
import { truthClassOf } from '../deck'
import { ROLES } from '../roles'
import type { RoleId } from '../types'
import type { InfoPart } from './part'

/** The parts she may speak of: the innocent and the suspicious, never the murderer's side, nor her own. */
const spokenOf = (r: RoleId) => r !== 'socialite' && (ROLES[r].class === 'innocent' || ROLES[r].class === 'suspicious')

/** The parts the script deals from that she may speak of. */
const onScript = (script: { innocents: readonly RoleId[]; suspicious: readonly RoleId[] }) =>
  [...new Set([...script.innocents, ...script.suspicious])].filter(spokenOf)

export const socialite: InfoPart = {
  knowsOfTheLies({ rng, script, roles, coverRoles, careful, culprit, truth }, me) {
    const so = rng.fork('socialite')
    const here = [...new Set(roles.filter((r, c) => c !== me && spokenOf(r)))]
    // (Never the part the Careful Murderer passes for: nobody's account catches them.)
    const hidden = careful ? coverRoles.get(culprit) : undefined
    const away = onScript(script).filter((r) => !roles.includes(r) && r !== hidden)
    if (here.length === 0 || away.length === 0) return null
    // Most often a part somebody is passing for (or the Drunk believes is theirs), and nobody is.
    const claimed = [...new Set([...coverRoles.values(), truth.drunkBelievedRole])].filter(
      (r): r is RoleId => r !== null && away.includes(r),
    )
    return {
      kind: 'guestList',
      here: so.pick(here),
      away: claimed.length > 0 && so.chance(0.7) ? so.pick(claimed) : so.pick(away),
    }
  },
  fabricate({ rng, cast, roles, speaker }) {
    // Passing for her: an honest guest's own part said to be away, and a part
    // truly here. (Never the murderer's side: no lie of this kind is told about them.)
    const honest = cast.map((m) => m.id).filter((c) => c !== speaker && truthClassOf(roles[c]) === 'honest' && spokenOf(roles[c]))
    if (honest.length === 0) return null
    const away = roles[rng.pick(honest)]
    const here = [...new Set(roles.filter((r, c) => c !== speaker && r !== away && spokenOf(r)))]
    if (here.length === 0) return null
    return { kind: 'guestList', here: rng.pick(here), away }
  },
  careful({ rng, roles, script, others }) {
    // True of both, and it catches nobody: a part here, and one of the
    // suspicious away (nobody passes for one of those, nor believes it theirs).
    const here = [...new Set(others.map((c) => roles[c]).filter(spokenOf))]
    const away = script.suspicious.filter((r) => spokenOf(r) && !roles.includes(r))
    if (here.length === 0 || away.length === 0) return null
    return { kind: 'guestList', here: rng.pick(here), away: rng.pick(away) }
  },
}
