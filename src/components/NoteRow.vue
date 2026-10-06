<script setup lang="ts">
import Icon from './Icon.vue'
import RoleText from './RoleText.vue'

defineProps<{
  main: string
  speaker?: string
  prov?: string
  flag?: 'realized' | 'proven' | 'link' | null
  /** Said, and since owned to be a lie by whoever said it, under pressing. */
  lie?: boolean
}>()
</script>

<template>
  <div class="row" :class="{ lied: lie }">
    <span v-if="speaker" class="who">{{ speaker }}: </span>
    <span class="main"><RoleText :text="main" on-paper /></span>
    <span v-if="lie" class="lie" title="A lie. They have owned to it"><Icon name="mask" /> lie</span>
    <Icon v-if="flag === 'proven'" name="double" class="mark" title="Proven false by evidence" />
    <Icon
      v-else-if="flag === 'realized'"
      name="bolt"
      class="mark"
      title="Part of a realised contradiction"
    />
    <Icon v-else-if="flag === 'link'" name="link" class="mark link" title="Part of a realised corroboration" />
    <span v-if="prov" class="prov">, {{ prov }}</span>
  </div>
</template>

<style scoped>
.row {
  line-height: 1.55rem;
  font-size: 0.88rem;
  padding: 0 0.2rem;
}
.who {
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}
.mark {
  margin-left: 0.25rem;
  color: #8a3a2c;
}
.mark.link {
  color: #3d6b3a;
}
.prov {
  color: var(--paper-muted);
  font-size: 0.78rem;
}
/* Owned to be a lie: the words stay, faded, with the mask beside them. */
.lied .main {
  opacity: 0.55;
}
.lie {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
  margin-left: 0.35em;
  padding: 0 0.35em;
  border: 1px solid rgba(160, 50, 40, 0.6);
  border-radius: 2px;
  font-size: 0.7em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  vertical-align: 0.1em;
  color: #a03228;
}
</style>
