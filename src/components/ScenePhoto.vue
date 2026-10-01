<script setup lang="ts">
// The photograph from the scene: the chalk drawn round where the body lay, on
// the floor it lay on. Which of each is the case's own, and says nothing about
// how it was done. The figure is drawn as a solid body of limbs and then only
// its edge is kept, so the chalk runs round it in one line however the limbs
// cross.
import { computed } from 'vue'
import PhotoPrint from './PhotoPrint.vue'

const props = defineProps<{ seed: number }>()

/** A head, a trunk, and four limbs as lines from shoulder or hip: x y pairs. */
interface Pose {
  head: [number, number]
  trunk: [number, number, number, number]
  limbs: number[][]
}
const POSES: Pose[] = [
  // Flung down on the back, an arm up and an arm out.
  { head: [24, 42], trunk: [34, 43, 64, 44], limbs: [[38, 37, 30, 23, 36, 11], [40, 50, 48, 62, 44, 76], [64, 40, 84, 31, 104, 25], [64, 49, 86, 58, 102, 68]] },
  // On the side, an arm thrown ahead and the knees bent.
  { head: [26, 40], trunk: [36, 42, 64, 46], limbs: [[38, 37, 44, 22, 58, 16], [40, 50, 42, 64, 34, 76], [64, 42, 88, 35, 104, 44], [64, 50, 84, 66, 104, 72]] },
  // Face down, both arms reaching on ahead.
  { head: [22, 45], trunk: [32, 45, 62, 45], limbs: [[35, 39, 24, 28, 12, 24], [35, 51, 23, 61, 11, 64], [62, 41, 86, 38, 110, 36], [62, 49, 86, 54, 108, 59]] },
  // Fallen the other way, a knee drawn up.
  { head: [96, 30], trunk: [87, 36, 61, 46], limbs: [[84, 31, 80, 17, 68, 12], [84, 41, 92, 57, 104, 62], [61, 42, 41, 35, 23, 44], [61, 50, 39, 60, 17, 62]] },
]
const FLOORS = ['boards', 'tiles', 'rug'] as const

const pose = computed(() => POSES[props.seed % POSES.length])
const floor = computed(() => FLOORS[Math.floor(props.seed / POSES.length) % FLOORS.length])
const line = (pts: number[]) => `M${pts[0]} ${pts[1]}` + pts.slice(2).map((v, i) => (i % 2 ? ` ${v}` : `L${v}`)).join('')
</script>

<template>
  <PhotoPrint>
    <svg viewBox="0 0 120 90">
      <defs>
        <radialGradient id="photo-light" cx="45%" cy="40%" r="75%">
          <stop offset="0" stop-color="#8a7556" />
          <stop offset="1" stop-color="#2e261b" />
        </radialGradient>
        <!--
          Soften the figure so close limbs run together and corners round, then
          keep only a thin band round its edge, in chalk.
        -->
        <filter id="photo-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="soft" />
          <feComponentTransfer in="soft" result="body">
            <feFuncA type="linear" slope="30" intercept="-12" />
          </feComponentTransfer>
          <feGaussianBlur in="body" stdDeviation="0.9" result="haze" />
          <feComponentTransfer in="haze" result="grown">
            <feFuncA type="linear" slope="30" intercept="-1.5" />
          </feComponentTransfer>
          <feComposite in="grown" in2="body" operator="out" result="edge" />
          <feFlood flood-color="#f1ead8" flood-opacity="0.92" />
          <feComposite in2="edge" operator="in" />
        </filter>
      </defs>
      <rect width="120" height="90" fill="url(#photo-light)" />
      <g v-if="floor === 'boards'" class="floor">
        <path d="M0 11h120M0 22h120M0 33h120M0 44h120M0 55h120M0 66h120M0 77h120" />
        <path d="M30 0v11M85 11v11M18 22v11M64 33v11M104 44v11M40 55v11M92 66v11M12 77v13" />
      </g>
      <g v-else-if="floor === 'tiles'" class="floor">
        <path d="M0 15h120M0 30h120M0 45h120M0 60h120M0 75h120M15 0v90M30 0v90M45 0v90M60 0v90M75 0v90M90 0v90M105 0v90" />
      </g>
      <g v-else class="floor">
        <rect x="8" y="8" width="104" height="74" />
        <rect x="13" y="13" width="94" height="64" />
        <path d="M60 18l14 27-14 27-14-27z" />
      </g>
      <g filter="url(#photo-chalk)">
        <circle :cx="pose.head[0]" :cy="pose.head[1]" r="8" />
        <path class="trunk" :d="line(pose.trunk)" />
        <path v-for="(l, i) in pose.limbs" :key="i" class="limb" :d="line(l)" />
      </g>
    </svg>
  </PhotoPrint>
</template>

<style scoped>
.floor path,
.floor rect {
  fill: none;
  stroke: rgba(20, 14, 8, 0.45);
  stroke-width: 0.6;
}
circle {
  fill: #000;
}
.trunk,
.limb {
  fill: none;
  stroke: #000;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.trunk {
  stroke-width: 16;
}
.limb {
  stroke-width: 7.5;
}
</style>
