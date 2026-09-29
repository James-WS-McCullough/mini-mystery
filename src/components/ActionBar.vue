<script setup lang="ts">
// What to do next, always in the same place: a scene puts its way onward
// here, at the foot of the stage, however long the scene itself has grown.
// Lesser actions go in the `aside` slot, to the left.
</script>

<template>
  <Teleport to="#action-bar" defer>
    <div class="row">
      <div class="aside"><slot name="aside" /></div>
      <div class="onward"><slot /></div>
    </div>
  </Teleport>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.8rem;
  max-width: 68rem;
  margin: 0 auto;
  animation: rise 0.25s ease-out both;
}
.aside,
.onward {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.onward {
  margin-left: auto;
  justify-content: flex-end;
}
.row :deep(button.primary) {
  padding: 0.55rem 1.4rem;
  font-size: 0.95rem;
}
@media (max-width: 560px) {
  .row {
    justify-content: center;
  }
  .onward {
    margin-left: 0;
    justify-content: center;
    flex: 1 1 100%;
  }
  .onward :deep(button.primary) {
    flex: 1;
  }
}
</style>
