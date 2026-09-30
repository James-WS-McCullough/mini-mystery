<script setup lang="ts">
// The weather and the light: rain on the glass (or snow drifting past it, or a
// gale driving the rain sideways), candle-glow, film grain, and now and then a
// stroke of lightning, with its thunder a moment behind. Sits behind every scene.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { thunder, thunderDelay } from '../ui/audio'
import { settings } from '../ui/settings'

const props = withDefaults(
  defineProps<{
    storm?: 'heavy' | 'light'
    /** How near the storm has come: 0 a way off, 1 overhead. */
    near?: number
    /**
     * The weather outside: a storm; snow, drifting, with no thunder; a
     * blizzard, the snow rushing past sideways; a gale at sea, the rain driven
     * sideways; or a calm night with nothing at the glass.
     */
    weather?: 'storm' | 'snow' | 'blizzard' | 'gale' | 'calm'
  }>(),
  { storm: 'light', near: 0, weather: 'storm' },
)

const canvas = ref<HTMLCanvasElement | null>(null)
const flash = ref(false)

interface Drop {
  x: number
  y: number
  len: number
  speed: number
  /** A flake's own sway, so no two drift alike. */
  phase: number
  size: number
}

let drops: Drop[] = []
let raf = 0
let last = 0
/** How plainly the weather is drawn: it fades out and in again when it changes. */
let fade = 1
let fadeTo = 1
/** What to do once the old weather has faded: seed the new, or stop. */
let pending: (() => void) | null = null
/** What the drops on the glass are: they keep their kind until reseeded, whatever the prop says meanwhile. */
let drawn: 'storm' | 'snow' | 'blizzard' | 'gale' | 'calm' = 'storm'
const snowy = (k: typeof drawn) => k === 'snow' || k === 'blizzard'
let lightning: ReturnType<typeof setTimeout> | undefined
let w = 0
let h = 0

function resize() {
  const c = canvas.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = c.clientWidth
  h = c.clientHeight
  c.width = w * dpr
  c.height = h * dpr
  c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
  seed()
}

function seed() {
  drawn = props.weather ?? 'storm'
  const density =
    drawn === 'snow' ? 1 / 9000 : drawn === 'blizzard' ? 1 / 7000 : props.storm === 'heavy' ? 1 / 5200 : 1 / 11000
  const n = Math.round(w * h * density)
  drops = Array.from({ length: n }, () => ({
    x: Math.random() * (w + 200) - 100,
    y: Math.random() * h,
    len: 10 + Math.random() * 22,
    speed:
      drawn === 'snow'
        ? 45 + Math.random() * 70
        : drawn === 'blizzard'
          ? 140 + Math.random() * 160
          : 700 + Math.random() * 600,
    phase: Math.random() * Math.PI * 2,
    size: 0.8 + Math.random() * 1.6,
  }))
}

function draw(t: number) {
  const c = canvas.value
  const g = c?.getContext('2d')
  if (!c || !g) return
  const dt = Math.min((t - last) / 1000, 0.05)
  last = t
  g.clearRect(0, 0, w, h)
  if (fade !== fadeTo) {
    fade = fadeTo > fade ? Math.min(fadeTo, fade + dt * 1.6) : Math.max(fadeTo, fade - dt * 1.6)
    if (fade === 0 && pending) {
      const next = pending
      pending = null
      next()
      if (props.weather === 'calm') return
      fadeTo = 1
    }
  }
  g.globalAlpha = fade
  if (snowy(drawn)) {
    // Flakes: swaying, and blown along by a wind that comes and goes — a
    // breath of it in the village, and in a blizzard a rush that streaks them.
    const blizzard = drawn === 'blizzard'
    const wind = blizzard ? 320 + 160 * (0.5 + 0.5 * Math.sin(t / 2600)) : 30 + 60 * (0.5 + 0.5 * Math.sin(t / 4200))
    const sway = blizzard ? 60 : 25
    // Dimmer than the rain: white flakes over the text would fight it.
    g.fillStyle = 'rgba(190, 200, 214, 0.42)'
    g.strokeStyle = 'rgba(190, 200, 214, 0.32)'
    g.lineWidth = 1.2
    if (blizzard) g.beginPath()
    for (const d of drops) {
      const vx = -(wind + sway * Math.sin(t / 900 + d.phase))
      d.y += d.speed * dt
      d.x += vx * dt
      if (d.y > h + 10 || d.x < -110) {
        d.y = d.x < -110 ? Math.random() * h : -10
        d.x = d.x < -110 ? w + 100 : Math.random() * (w + 200) - 100
      }
      if (blizzard) {
        // A streak along the way it is going, longer the faster it goes.
        const k = 0.03 * d.size
        g.moveTo(d.x, d.y)
        g.lineTo(d.x - vx * k, d.y - d.speed * k)
      } else {
        g.beginPath()
        g.arc(d.x, d.y, d.size, 0, Math.PI * 2)
        g.fill()
      }
    }
    if (blizzard) g.stroke()
  } else {
    // Rain — driven near sideways in a gale.
    const lean = drawn === 'gale' ? 0.6 : 0.18
    g.strokeStyle = 'rgba(190, 205, 225, 0.22)'
    g.lineWidth = 1
    g.beginPath()
    for (const d of drops) {
      d.y += d.speed * dt
      d.x -= d.speed * dt * lean
      if (d.y > h + 30 || d.x < -100) {
        d.y = -30
        d.x = Math.random() * (w + 200 + w * lean) - 100
      }
      g.moveTo(d.x, d.y)
      g.lineTo(d.x + d.len * lean, d.y - d.len)
    }
    g.stroke()
  }
  raf = requestAnimationFrame(draw)
}

function start() {
  stop()
  if (props.weather === 'calm') return
  // No thunder in the snow.
  if (!snowy(props.weather ?? 'storm')) scheduleLightning()
  if (settings.reducedMotion) return
  seed()
  fade = fadeTo = 1
  pending = null
  last = performance.now()
  raf = requestAnimationFrame(draw)
}

/** The weather changes: what is drawn fades away, and the new comes up in its place. */
function change() {
  if (settings.reducedMotion || !raf) {
    start()
    return
  }
  clearTimeout(lightning)
  if (!snowy(props.weather ?? 'storm') && props.weather !== 'calm') scheduleLightning()
  fadeTo = 0
  pending = () => {
    if (props.weather === 'calm') {
      stop()
      return
    }
    seed()
  }
}

function stop() {
  cancelAnimationFrame(raf)
  raf = 0
  clearTimeout(lightning)
  const c = canvas.value
  c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
}

function scheduleLightning() {
  // Oftener, too, as it comes nearer.
  const lull = props.storm === 'heavy' ? 14000 : 38000 - 16000 * props.near
  const wait = lull + Math.random() * (30000 - 10000 * props.near)
  lightning = setTimeout(() => {
    if (document.visibilityState === 'visible') {
      if (!settings.reducedMotion) {
        flash.value = true
        setTimeout(() => (flash.value = false), 420)
      }
      // The sound follows the light — by less and less, as the storm comes on.
      const near = props.near
      setTimeout(() => thunder(near), thunderDelay(near))
    }
    scheduleLightning()
  }, wait)
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  start()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  stop()
})
watch(() => settings.reducedMotion, start)
watch(() => props.weather, change)
watch(
  () => props.storm,
  () => seed(),
)
</script>

<template>
  <div class="atmosphere" aria-hidden="true">
    <div class="glow" />
    <canvas ref="canvas" class="rain" />
    <div class="flash" :class="{ on: flash }" />
    <div class="grain" />
    <div class="vignette" />
  </div>
</template>

<style scoped>
.atmosphere,
.atmosphere > * {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.atmosphere {
  z-index: 0;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 38%, #18202a 0%, var(--bg) 62%, #06080a 100%);
}
.rain {
  width: 100%;
  height: 100%;
}
.glow {
  background:
    radial-gradient(ellipse 46% 40% at 50% 108%, rgba(212, 150, 60, 0.2), transparent 70%),
    radial-gradient(ellipse 30% 30% at 8% 4%, rgba(212, 175, 74, 0.07), transparent 70%);
  animation: flicker 5.5s ease-in-out infinite;
}
.flash {
  background: linear-gradient(180deg, rgba(200, 220, 255, 0.5), rgba(200, 220, 255, 0.08));
  opacity: 0;
}
.flash.on {
  animation: lightning 0.42s ease-out;
}
.grain {
  opacity: 0.11;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.vignette {
  background: radial-gradient(ellipse at center, transparent 48%, rgba(0, 0, 0, 0.62) 100%);
}
@keyframes flicker {
  0%,
  100% {
    opacity: 0.85;
  }
  23% {
    opacity: 1;
  }
  41% {
    opacity: 0.74;
  }
  58% {
    opacity: 0.96;
  }
  77% {
    opacity: 0.8;
  }
}
@keyframes lightning {
  0% {
    opacity: 0;
  }
  8% {
    opacity: 0.9;
  }
  22% {
    opacity: 0.15;
  }
  34% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
  }
}
</style>
