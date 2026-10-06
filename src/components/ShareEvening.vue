<script setup lang="ts">
// An evening of the detective's own, to be sent to somebody: a link to copy,
// the phone's own way of sending it where there is one, and the same link as
// a QR code to read off the screen. Whoever opens it is offered the evening
// (see EveningInvitation).
import { encode } from 'uqr'
import { computed, ref, watch } from 'vue'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { sizeOf } from '../ui/evenings'
import { shareLink } from '../ui/shareEvening'
import Icon from './Icon.vue'
import Overlay from './Overlay.vue'

const ui = useUi()
const link = computed(() => (ui.sharing ? shareLink(ui.sharing.name, ui.sharing.script) : ''))

/** The QR code as one path of dark squares, a square of paper about it. */
const qr = computed(() => {
  if (!link.value) return null
  const { data, size } = encode(link.value, { ecc: 'M', border: 2 })
  const d = data.flatMap((row, y) => row.flatMap((dark, x) => (dark ? [`M${x} ${y}h1v1h-1z`] : []))).join('')
  return { d, size }
})

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
async function share() {
  if (!ui.sharing) return
  sfx('select')
  try {
    await navigator.share({ title: ui.sharing.name, text: `An evening of Mini-Mystery for you: “${ui.sharing.name}”.`, url: link.value })
  } catch {
    // (Put away without sending: nothing to say.)
  }
}

const field = ref<HTMLInputElement | null>(null)
const copied = ref(false)
let settle: ReturnType<typeof setTimeout> | undefined
async function copy() {
  sfx('click')
  try {
    await navigator.clipboard.writeText(link.value)
  } catch {
    // (No clipboard to write to: the link is chosen in its field, to be copied by hand.)
    field.value?.select()
    if (!document.execCommand?.('copy')) return
  }
  copied.value = true
  clearTimeout(settle)
  settle = setTimeout(() => (copied.value = false), 2400)
}
watch(
  () => ui.sharing,
  () => (copied.value = false),
)
</script>

<template>
  <Overlay :open="!!ui.sharing" title="Share this evening" width="26rem" @close="ui.sharing = null">
    <template v-if="ui.sharing">
      <div class="what">
        <strong class="name">{{ ui.sharing.name }}</strong>
        <span class="small muted">{{ sizeOf(ui.sharing.script) }}</span>
      </div>

      <svg
        v-if="qr"
        class="qr"
        :viewBox="`0 0 ${qr.size} ${qr.size}`"
        shape-rendering="crispEdges"
        role="img"
        aria-label="A QR code of the link"
      >
        <rect :width="qr.size" :height="qr.size" fill="#fff" />
        <path :d="qr.d" fill="#111" />
      </svg>

      <p class="small muted lede">Anyone who opens the link, or reads the code with their phone’s camera, can keep this evening and play it.</p>
      <input ref="field" class="link" :value="link" readonly aria-label="The link" @focus="($event.target as HTMLInputElement).select()" />
    </template>

    <template #actions>
      <button v-if="canShare" @click="share()"><Icon name="share" /> Send…</button>
      <button class="primary" @click="copy()">
        <template v-if="copied"><Icon name="check" /> Copied</template>
        <template v-else><Icon name="link" /> Copy link</template>
      </button>
    </template>
  </Overlay>
</template>

<style scoped>
.what {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  text-align: center;
}
.name {
  font-family: var(--font-display);
  font-weight: normal;
  font-size: 1.35rem;
  letter-spacing: 0.06em;
  color: var(--brass);
}
.qr {
  display: block;
  width: min(15rem, 70vw);
  height: auto;
  margin: 1rem auto 0;
  border-radius: 4px;
  box-shadow: var(--shadow);
}
.lede {
  margin: 1rem 0 0.6rem;
  line-height: 1.45;
  text-align: center;
}
.link {
  width: 100%;
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
