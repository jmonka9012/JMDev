<script setup>
import HoverScramble from "./Partials/HoverScramble.vue";
import ScrambleGroup from "./Partials/ScrambleGroup.vue";
import { useElementsRegistry } from "../utils/useRegistry.js";
const { registerElement, unregisterElement } = useElementsRegistry();
import { onMounted, onUnmounted } from "vue";

const myId = "hero";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  registerElement({
    id: myId,
    title: props.data.menu_name,
  });
});

onUnmounted(() => {
  unregisterElement(myId);
});
</script>

<template>
  <section :id="myId" class="section-fvh justify-center">
    <div class="container">
      <h1 class="hero-text">
        <HoverScramble>Jacek Mońka</HoverScramble>
        <br />
        <ScrambleGroup
          :words="data.scramble_group.split('|')"
          :suffixes="data.scramble_group_suffixes.split('|')"
          :interval="3000"
        />
      </h1>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero-text {
  @include media-breakpoint-down(sm) {
    font-size: 32px;
  }
}
</style>
