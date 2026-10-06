<script setup lang="ts">
// How to keep the game on the home screen: the browser's own prompt where it
// has one, and otherwise the way through its menu, told for the browser in hand.
import { computed, ref } from 'vue'
import { useUi } from '../stores/ui'
import { sfx } from '../ui/audio'
import { browserName, canPrompt, installWay, promptInstall } from '../ui/install'
import Icon from './Icon.vue'
import Overlay from './Overlay.vue'

const ui = useUi()
const way = computed(() => installWay())
const icon = `${import.meta.env.BASE_URL}icon.svg`
const added = ref(false)

/**
 * What becomes of the record. A phone's home-screen copy of a web app keeps
 * its own storage on an iPhone, apart from Safari's; Android and the desktop
 * browsers share theirs with the installed app.
 */
const lede = computed(() =>
  way.value === 'ios'
    ? 'Put Mini-Mystery on your home screen and it opens full screen, like any other app. The home-screen copy keeps a record of its own, so finish any case you have open here first.'
    : 'Put Mini-Mystery on your home screen and it opens full screen, like any other app. Your cases and your service record come with it.',
)
/** The browser by name where it is known, else "your browser". */
const browser = computed(() => browserName() ?? 'your browser')
const its = computed(() => `${browser.value}’s`)
const steps = computed(() => {
  switch (way.value) {
    case 'ios':
      return [
        { icon: 'share', text: `Tap the Share button in ${browser.value}: the square with an arrow rising out of it.` },
        { icon: 'down', text: 'Scroll down the sheet and tap Add to Home Screen.' },
        { icon: 'check', text: 'Tap Add. The game sits on your home screen, and opens full screen, like any other app.' },
      ] as const
    case 'android':
      return [
        { icon: 'list', text: `Tap ${its.value} menu: the three dots, at the top or the bottom of the screen.` },
        { icon: 'download', text: 'Tap Install app, or Add to Home screen, whichever it offers.' },
        { icon: 'check', text: 'Confirm. The game sits on your home screen, and opens full screen, like any other app.' },
      ] as const
    default:
      return [
        { icon: 'download', text: `Look for the install icon at the right of ${its.value} address bar, or open its menu and choose Install Mini-Mystery.` },
        { icon: 'check', text: 'Confirm. The game opens in a window of its own, with no browser about it.' },
      ] as const
  }
})

async function install() {
  sfx('select')
  added.value = await promptInstall()
}
</script>

<template>
  <Overlay :open="ui.installOpen" title="Keep it to hand" width="28rem" @close="ui.installOpen = false">
    <div class="keep">
      <img :src="icon" alt="" class="app" />
      <p class="lede">{{ lede }}</p>
    </div>

    <template v-if="added">
      <p class="added"><Icon name="check" /> Added. Look for it on your home screen.</p>
    </template>
    <template v-else-if="canPrompt">
      <p class="small muted">This browser can add it for you.</p>
    </template>
    <ol v-else class="steps">
      <li v-for="(s, i) in steps" :key="i">
        <Icon :name="s.icon" />
        <span>{{ s.text }}</span>
      </li>
    </ol>

    <template #actions>
      <button v-if="canPrompt && !added" class="primary" @click="install()"><Icon name="download" /> Add to home screen</button>
      <button :class="canPrompt && !added ? '' : 'primary'" @click="ui.installOpen = false">Done</button>
    </template>
  </Overlay>
</template>

<style scoped>
.keep {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.app {
  flex: none;
  width: 4.2rem;
  height: 4.2rem;
  border-radius: 22%;
  box-shadow: var(--shadow);
}
.lede {
  margin: 0;
  line-height: 1.5;
}
.steps {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.7rem;
  counter-reset: step;
}
.steps li {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  line-height: 1.45;
}
.steps li .icon {
  flex: none;
  margin-top: 0.2rem;
  color: var(--brass);
}
.added {
  margin: 1rem 0 0;
  color: var(--good);
}
.small {
  margin: 1rem 0 0;
}
</style>
