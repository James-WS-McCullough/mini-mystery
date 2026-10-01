<script setup lang="ts">
// An exhibit: the thing itself cut from black paper, in a square frame whose
// colour says what kind of thing it is.
import { computed } from 'vue'
import { useGame } from '../stores/game'
import { lookOf, namedBy } from '../ui/itemArt'
import Portrait from './Portrait.vue'

const props = withDefaults(
  defineProps<{
    /** EvidenceItem.id */
    item: string
    size?: string
    dim?: boolean
  }>(),
  { size: '3rem' },
)

const game = useGame()
const evidence = computed(() => game.mystery?.evidence.find((e) => e.id === props.item))
const look = computed(() =>
  evidence.value && game.ctx ? lookOf(evidence.value, game.ctx.pack) : null,
)
/** Whom the exhibit names, shown by their face beside it (see namedBy). */
const named = computed(() => {
  const id = evidence.value ? namedBy(evidence.value) : undefined
  return id === undefined ? null : game.mystery!.cast[id]
})
const TONES = { ink: '#07090c', pale: '#f3e7c3', brass: '#e2bd55', russet: '#c2692b', grey: '#b8b2a4', leather: '#7d4a26' } as const
const gradient = computed(() => `item-${props.item.replace(/[^a-z0-9]/gi, '')}`)
</script>

<template>
  <!-- The exhibit, and beside it the face of whoever it names. -->
  <span v-if="look" class="exhibit-with" :class="{ named }">
    <span
      class="item-art"
      :class="[look.kind, { dim }]"
      :style="{ width: size, height: size, '--tint': look.tint }"
      :title="named ? `${look.label} — ${named.shortName}` : look.label"
      role="img"
      :aria-label="named ? `${look.label} — ${named.shortName}` : look.label"
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <radialGradient :id="gradient" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stop-color="var(--tint)" stop-opacity="1" />
            <stop offset="100%" stop-color="var(--tint)" stop-opacity="0.55" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="#0b0e12" />
        <rect width="100" height="100" :fill="`url(#${gradient})`" />
        <g transform="translate(50 50) scale(0.82) translate(-50 -50)">
          <template v-for="(l, i) in look.layers" :key="i">
            <path
              v-if="l.stroke"
              :d="l.d"
              fill="none"
              :stroke="TONES[l.tone]"
              :stroke-width="l.stroke"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path v-else :d="l.d" :fill="TONES[l.tone]" />
          </template>
        </g>
      </svg>
    </span>
    <Portrait
      v-if="named"
      class="face"
      :who="named.defId"
      shape="token"
      :size="`calc(${size} * 0.72)`"
      :dim="dim"
    />
  </span>
</template>

<style scoped>
.item-art {
  display: inline-block;
  flex: none;
  border: 2px solid var(--brass);
  border-radius: 3px;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.6),
    0 3px 8px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  line-height: 0;
  vertical-align: middle;
}
.item-art svg {
  display: block;
  width: 100%;
  height: 100%;
}
.item-art.dim {
  filter: grayscale(0.7) brightness(0.7);
}
.exhibit-with {
  display: inline-flex;
  flex: none;
  align-items: center;
  vertical-align: middle;
}
.exhibit-with.named {
  gap: 0.35em;
}
</style>
