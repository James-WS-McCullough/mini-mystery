// One phase of dealing a night (see generate.ts).

import { HELPERS, truthClassOf } from '../deck'
import type { AfterCast } from './night'

/** Where each part sits tonight (-1: not in the house), and who is honest. */
export function seatRoles(night: AfterCast) {
  const { roles, cast } = night
  const thief = roles.indexOf('thief')
  const drunk = roles.indexOf('drunk')
  const begrudged = roles.indexOf('begrudged')
  const loner = roles.indexOf('loner')
  const witness = roles.indexOf('witness')
  const oracle = roles.indexOf('oracle')
  const confidant = roles.indexOf('confidant')
  const gossip = roles.indexOf('gossip')
  const sleuth = roles.indexOf('sleuth')
  const redherring = roles.indexOf('redherring')
  const steward = roles.indexOf('steward')
  const companion = roles.indexOf('alibi')
  const perjurer = roles.indexOf('perjurer')
  const blackmailer = roles.indexOf('blackmailer')
  const amnesiac = roles.indexOf('amnesiac')
  const sweetheart = roles.indexOf('sweetheart')
  const collector = roles.indexOf('collector')
  const architect = roles.indexOf('architect')
  const porter = roles.indexOf('porter')
  const spinster = roles.indexOf('spinster')
  const clinger = roles.indexOf('clinger')
  const discoverer = roles.indexOf('discoverer')
  const forger = roles.indexOf('forger')
  const framer = roles.indexOf('framer')
  const cleaner = roles.indexOf('cleaner')
  const whisperer = roles.indexOf('whisperer')
  const sponsor = roles.indexOf('sponsor')
  const martyr = roles.indexOf('martyr')
  /** The murderer's friend, where there is one. */
  const helper = roles.findIndex((r) => HELPERS.includes(r))
  /** Whoever looks worse than they are tonight — and the murderer's friend, who is. */
  const shadyIds = [thief, begrudged, loner, redherring, blackmailer, amnesiac, sweetheart, clinger, helper, drunk].filter(
    (x) => x >= 0,
  )
  /** With a single liar the world collapses fast — informants soften so the
   *  night keeps its length. */
  const singleLiar = thief < 0

  const honestIds = cast.map((m) => m.id).filter((c) => truthClassOf(roles[c]) === 'honest')

  return {
    thief, drunk, begrudged, loner, witness, oracle, confidant, gossip, sleuth, redherring, steward,
    companion, perjurer, blackmailer, amnesiac, sweetheart, collector, architect, porter, spinster, clinger,
    discoverer, forger, framer, cleaner, whisperer, sponsor, martyr, helper, shadyIds, singleLiar, honestIds,
  }
}
