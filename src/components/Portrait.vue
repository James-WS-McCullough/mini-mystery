<script setup lang="ts">
// A cameo: the sitter in profile, cut from black paper, in a brass frame.
import { computed } from 'vue'
import type { SilhouetteDef } from '../content/schema'
import { useGame } from '../stores/game'

const props = withDefaults(
  defineProps<{
    /** CastMember.defId — which sitter to draw. Omit for an anonymous figure. */
    who?: string
    /** `cameo` is the full oval bust; `token` a round head for maps and lists. */
    shape?: 'cameo' | 'token'
    size?: string
    /** A passing reaction; the parent clears it when the moment is over. */
    mood?: 'idle' | 'speaking' | 'flinch' | 'slump'
    dim?: boolean
    /** The trait to draw them with. By default, the one tonight's case dealt them. */
    trait?: string | null
  }>(),
  { shape: 'cameo', size: '5rem', mood: 'idle' },
)

const game = useGame()

// The standard sitter: a head and neck, and a pair of shoulders to stand on.
const HEAD =
  'M39 80C31 74 27 62 28 50 29 30 42 18 54 19c8 .5 13 5 13.5 12 .5 4-1 7-.5 10l6.5 11.5c.5 2-2.5 3-5 3 0 2 2 3 2 4.5s-2.5 1.5-3 2.5c1.5 1 2 2.5 1 4-1.5 1-2 2-1 4 1 3-1.5 6-6 6.5-3 .5-4.5 2-5 5-.4 4.5 .3 9 2 14H35c3.5-5 5-11 4-18z'
const BODY = 'M10 120c0-14 8-22 22-26l6-2.5h20l5 2C76 99 88 106 90 120z'
/**
 * The neck, from behind the jaw down into the shoulders. It belongs to the
 * figure, not the head: however a head is sized, set or tilted, it stays
 * joined to the body beneath it.
 */
const NECK_SHAPE =
  'M38 68h19c0 10 .6 17 2.6 22.5l1.4 5H34l1.4-5c2-5.5 2.6-12.5 2.6-22.5z'
/** Carries every figure, however narrow, down past the bottom of the frame. */
const FLOOR = 'M-20 117h140v24H-20z'
/** The base of the neck: heads are resized and tilted about this point. */
const NECK = '47 94'

const ANON: SilhouetteDef = { tint: '#77828f', layers: [] }

/** Mix a #rrggbb colour toward white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number): string {
  const target = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
    return Math.round(c + (target - c) * t)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(0)}${channel(1)}${channel(2)}`
}

const def = computed<SilhouetteDef>(
  () => (props.who && game.ctx?.pack.silhouettes?.[props.who]) || ANON,
)
// The cameo falls away into shadow at its edge; the pin stays bright all over.
const backdrop = computed(() => ({
  lit: shade(def.value.tint, 0.22),
  edge: shade(def.value.tint, props.shape === 'token' ? -0.12 : -0.5),
}))
const neckTransform = computed(() => {
  const wide = def.value.neck ?? 1
  const h = def.value.head ?? {}
  // It follows the head a little way when the head is set forward or back.
  return `translate(${(h.dx ?? 0) * 0.5} 0) translate(${NECK}) scale(${wide} 1) translate(-${NECK.replace(' ', ' -')})`
})
const headTransform = computed(() => {
  const h = def.value.head ?? {}
  return [
    `translate(${h.dx ?? 0} ${h.dy ?? 0})`,
    `translate(${NECK})`,
    `rotate(${h.tilt ?? 0})`,
    `scale(${h.wide ?? 1} ${h.tall ?? 1})`,
    `translate(-${NECK.replace(' ', ' -')})`,
  ].join(' ')
})
/** The sitter as they are tonight: themselves, their trait, and what they hold. */
const layers = computed(() => {
  const trait =
    props.trait !== undefined
      ? props.trait
      : game.mystery?.cast.find((m) => m.defId === props.who)?.trait
  const look = trait
    ? (def.value.traits?.[trait] ?? game.ctx?.pack.traitLooks?.[trait])
    : undefined
  return [
    ...def.value.layers,
    ...(look?.takesHands ? [] : (def.value.prop ?? [])),
    ...(look?.layers ?? []),
  ]
})
const onHead = computed(() => layers.value.filter((l) => (l.on ?? 'head') === 'head'))
const onFigure = computed(() => layers.value.filter((l) => l.on === 'figure'))
const uid = computed(() => `cameo-${props.who ?? 'anon'}-${props.shape}`)
const viewBox = computed(() => (props.shape === 'token' ? '12 15 76 76' : '0 0 100 120'))
</script>

<template>
  <svg
    class="portrait"
    :class="[shape, mood, { dim }]"
    :viewBox="viewBox"
    :style="{ width: size }"
    aria-hidden="true"
  >
    <defs>
      <clipPath :id="`${uid}-clip`">
        <circle v-if="shape === 'token'" cx="50" cy="53" r="36" />
        <ellipse v-else cx="50" cy="60" rx="46" ry="56" />
      </clipPath>
      <radialGradient :id="`${uid}-bg`" cx="62%" cy="34%" r="80%">
        <stop offset="0" :stop-color="backdrop.lit" />
        <stop offset="1" :stop-color="backdrop.edge" />
      </radialGradient>
    </defs>

    <g :clip-path="`url(#${uid}-clip)`">
      <rect x="0" y="0" width="100" height="120" :fill="`url(#${uid}-bg)`" />
      <g class="sitter">
        <g transform="translate(50 111) scale(0.84) translate(-50 -120)">
          <path :d="FLOOR" class="ink" />
          <path :d="def.body ?? BODY" class="ink" />
          <path :d="NECK_SHAPE" :transform="neckTransform" class="ink" />
          <g :transform="headTransform">
            <path :d="HEAD" class="ink" />
            <template v-for="(l, i) in onHead" :key="i">
              <path
                v-if="l.stroke"
                :d="l.d"
                :class="`line ${l.tone}`"
                :stroke-width="l.stroke"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path v-else :d="l.d" :class="l.tone" />
            </template>
          </g>
          <template v-for="(l, i) in onFigure" :key="i">
            <path
              v-if="l.stroke"
              :d="l.d"
              :class="`line ${l.tone}`"
              :stroke-width="l.stroke"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path v-else :d="l.d" :class="l.tone" />
          </template>
        </g>
      </g>
    </g>

    <template v-if="shape === 'token'">
      <circle cx="50" cy="53" r="36" class="ring" />
    </template>
    <template v-else>
      <ellipse cx="50" cy="60" rx="46" ry="56" class="ring" />
      <ellipse cx="50" cy="60" rx="48.5" ry="58.5" class="ring outer" />
    </template>
  </svg>
</template>

<style scoped>
.portrait {
  display: block;
  height: auto;
  flex: none;
  overflow: visible;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
  transition:
    filter 0.3s ease,
    opacity 0.3s ease;
}
.portrait.dim {
  opacity: 0.45;
  filter: grayscale(0.8);
}
.ink {
  fill: #06080a;
}
.brass {
  fill: #ffe08a;
}
.pale {
  fill: #fff8e6;
}
.line {
  fill: none;
}
.line.ink {
  stroke: #06080a;
}
.line.brass {
  stroke: #ffe08a;
}
.line.pale {
  stroke: #fff8e6;
}
.ring {
  fill: none;
  stroke: var(--brass);
  stroke-width: 1.6;
}
.ring.outer {
  stroke: var(--brass-dim);
  stroke-width: 0.7;
}
.token .ring {
  stroke-width: 2.6;
}

.sitter {
  transform-box: fill-box;
  transform-origin: 50% 100%;
}
.speaking .sitter {
  animation: nod 1.1s ease-in-out infinite;
}
.flinch .sitter {
  animation: flinch 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.slump .sitter {
  animation: slump 1.2s ease-out both;
}
@keyframes nod {
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: translateY(-1.2px) rotate(0.6deg);
  }
}
@keyframes flinch {
  0% {
    transform: none;
  }
  18% {
    transform: translateX(-7px) rotate(-3deg);
  }
  40% {
    transform: translateX(4px) rotate(1.5deg);
  }
  62% {
    transform: translateX(-3px) rotate(-1deg);
  }
  100% {
    transform: none;
  }
}
@keyframes slump {
  0% {
    transform: none;
  }
  100% {
    transform: translateY(5px) rotate(4deg);
  }
}
</style>
