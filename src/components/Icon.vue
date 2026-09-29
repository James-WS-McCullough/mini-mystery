<script setup lang="ts">
// One consistent line-icon set, so nothing depends on how a platform draws emoji.
import { computed } from 'vue'

export type IconName =
  | 'notebook'
  | 'bolt'
  | 'link'
  | 'mask'
  | 'key'
  | 'heart'
  | 'steps'
  | 'clock'
  | 'check'
  | 'alert'
  | 'search'
  | 'close'
  | 'gear'
  | 'sound'
  | 'mute'
  | 'map'
  | 'dagger'
  | 'eye'
  | 'ear'
  | 'gem'
  | 'back'
  | 'forward'
  | 'pin'
  | 'scales'
  | 'star'
  | 'question'
  | 'speech'
  | 'person'
  | 'trophy'
  | 'calendar'
  | 'book'
  | 'double'
  | 'pair'
  | 'flame'
  | 'moon'
  | 'glass'

const props = withDefaults(defineProps<{ name: IconName; size?: string; title?: string }>(), {
  size: '1em',
})

interface Shape {
  /** Stroked outlines. */
  d?: string[]
  /** Solid shapes. */
  fill?: string[]
}

const SHAPES: Record<IconName, Shape> = {
  notebook: {
    d: ['M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z', 'M6 3v18', 'M3.5 7h3M3.5 12h3M3.5 17h3', 'M10 8h6M10 12h6'],
  },
  bolt: { fill: ['M13.5 2 4.5 13.5h6L9 22l10-12.5h-6.2z'] },
  link: {
    d: [
      'M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.2 1.2',
      'M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.2-1.2',
    ],
  },
  mask: {
    d: [
      'M3 8c3-1.5 6-1.5 9 0 3-1.5 6-1.5 9 0 0 5-2.5 8.5-5.5 8.5-1.6 0-2.6-1-3.5-2.4-.9 1.4-1.9 2.4-3.5 2.4C5.5 16.5 3 13 3 8z',
      'M6.5 11c1-.8 2.5-.8 3.5 0M14 11c1-.8 2.5-.8 3.5 0',
    ],
  },
  key: {
    d: ['M8 17a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z', 'M12.2 11H21v3.5M17 11v2.8'],
  },
  heart: {
    d: ['M12 20.5S3.5 15.4 3.5 9.2A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.5 1.8c0 6.2-8.5 11.3-8.5 11.3z', 'M12 7.4l-1.6 3.4 3 2-1.4 3.2'],
  },
  steps: {
    fill: [
      'M7.2 3.2c1.7 0 2.8 1.7 2.8 4.2 0 2-.8 3.4-.8 4.6H5.6c0-1.2-1-2.5-1-4.6 0-2.5.9-4.2 2.6-4.2z',
      'M5.7 13.5h3.5c.2 1.8-.5 3-1.8 3s-1.9-1.2-1.7-3z',
      'M16.8 8.2c1.7 0 2.6 1.7 2.6 4.2 0 2.1-1 3.4-1 4.6h-3.6c0-1.2-.8-2.6-.8-4.6 0-2.5 1.1-4.2 2.8-4.2z',
      'M14.8 18.5h3.5c.2 1.8-.4 3-1.7 3s-2-1.2-1.8-3z',
    ],
  },
  clock: { d: ['M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z', 'M12 7v5.2l3.3 2'] },
  check: { d: ['M4.5 12.5l5 5L19.5 6.5'] },
  alert: { d: ['M12 3.5 2.5 20h19z', 'M12 10v4.5', 'M12 17.3v.2'] },
  search: { d: ['M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z', 'M15.3 15.3 21 21'] },
  close: { d: ['M5 5l14 14M19 5 5 19'] },
  gear: {
    d: [
      'M12 15.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z',
      'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1',
    ],
  },
  sound: { d: ['M4 9.5h3.5L12 5.5v13l-4.5-4H4z', 'M15.5 9a4.2 4.2 0 0 1 0 6', 'M18 6.5a7.8 7.8 0 0 1 0 11'] },
  mute: { d: ['M4 9.5h3.5L12 5.5v13l-4.5-4H4z', 'M16 9.5l5 5M21 9.5l-5 5'] },
  map: { d: ['M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z', 'M9 4v13.5M15 6.5V20'] },
  dagger: { d: ['M12 2.5l2.2 4v7.5h-4.4V6.5z', 'M7.5 14h9', 'M12 14v5.5', 'M10.5 21.5h3'] },
  eye: { d: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', 'M12 14.8a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z'] },
  ear: { d: ['M7 9.5a5.5 5.5 0 1 1 11 0c0 3.5-3 4.5-3.5 7.5-.4 2.4-1.8 4-3.8 4A3.7 3.7 0 0 1 7 17.3', 'M10 10a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.2 3.2'] },
  gem: { d: ['M12 3 20.5 12 12 21 3.5 12z', 'M7.7 7.7h8.6M12 3v18'] },
  back: { d: ['M10.5 5.5 4 12l6.5 6.5', 'M4 12h16'] },
  forward: { d: ['M13.5 5.5 20 12l-6.5 6.5', 'M20 12H4'] },
  pin: { d: ['M12 21.5v-8', 'M12 13.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'] },
  scales: { d: ['M12 3.5v17', 'M7.5 20.5h9', 'M4 7.5h16', 'M6 7.5 3 14a3.3 3.3 0 0 0 6 0z', 'M18 7.5 15 14a3.3 3.3 0 0 0 6 0z'] },
  star: { fill: ['M12 2.5l2.9 6.3 6.8.7-5.1 4.6 1.5 6.7L12 17.3 5.9 20.8l1.5-6.7-5.1-4.6 6.8-.7z'] },
  question: { d: ['M8.5 8.5a3.5 3.5 0 1 1 5.3 3c-1.2.8-1.8 1.5-1.8 3', 'M12 18.3v.2'] },
  speech: { d: ['M4 5h16v11h-8.5L7 20v-4H4z', 'M8 9.5h8M8 12.5h5'] },
  person: { d: ['M12 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z', 'M4.5 21c.5-4 3.5-6 7.5-6s7 2 7.5 6'] },
  trophy: { d: ['M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0z', 'M7.5 5.5H4c0 3 1.5 4.5 3.8 4.8M16.5 5.5H20c0 3-1.5 4.5-3.8 4.8', 'M12 14v3.5', 'M8 20.5h8', 'M9.5 17.5h5'] },
  calendar: { d: ['M4 5.5h16v15H4z', 'M4 10h16', 'M8 3v4M16 3v4', 'M8 14h2.5M13.5 14H16M8 17.3h2.5'] },
  book: { d: ['M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z', 'M12 6.5V20'] },
  double: { d: ['M6 6.5 11.5 12 6 17.5', 'M12.5 6.5 18 12l-5.5 5.5'] },
  pair: {
    d: [
      'M9 11.5a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z',
      'M3 20c.4-3.4 2.8-5 6-5s5.6 1.6 6 5',
      'M15.5 11.3a3 3 0 1 0-.6-5.9',
      'M17 15.2c2.3.5 3.7 2 4 4.8',
    ],
  },
  flame: {
    d: [
      'M12 2.5c.8 3.2 5 5 5 10a5 5 0 0 1-10 0c0-1.9.8-3.3 1.8-4.3.4 1.6 1.2 2.3 2 2.6C10.2 8 11.5 5.5 12 2.5z',
    ],
  },
  moon: { d: ['M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.8 6.8 0 0 0 11 11z'] },
  glass: { d: ['M7 3.5h10l-.8 5.5a4.2 4.2 0 0 1-8.4 0z', 'M12 13.2v7', 'M8.5 20.5h7'] },
}

const shape = computed(() => SHAPES[props.name])
</script>

<template>
  <svg
    class="icon"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="title ? 'img' : undefined"
    :aria-hidden="title ? undefined : 'true'"
    :aria-label="title"
  >
    <title v-if="title">{{ title }}</title>
    <path v-for="(d, i) in shape.d ?? []" :key="`s${i}`" :d="d" />
    <path v-for="(d, i) in shape.fill ?? []" :key="`f${i}`" :d="d" fill="currentColor" stroke="none" />
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: -0.14em;
  flex: none;
}
</style>
