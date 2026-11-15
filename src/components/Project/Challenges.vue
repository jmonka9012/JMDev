<script setup>
import ScrambleText from "../Partials/ScrambleText.vue";
import Challenge from "./Challenge.vue";
defineProps({
  items: { type: Array, default: () => [] },
  manifest: { type: Object, default: () => ({}) },
  copy: { type: Object, required: true },
});
</script>
<template>
  <section
    v-if="items.length"
    id="project-challenges"
    class="project-challenges project-challenges--frame-C project-challenges--no-media-columns"
    aria-labelledby="project-challenges-title"
  >
    <div class="container">
      <div class="project-section-heading">
        <ScrambleText
          id="project-challenges-title"
          tag="h2"
          :text="copy.challenges"
        /><span class="project-micro">02 / {{ copy.effects }}</span>
      </div>
    </div>
    <div class="project-challenges__items">
      <Challenge
        v-for="(item, index) in items"
        :key="index"
        :item="item"
        :index="index"
        :manifest="manifest"
        :copy="copy"
      />
    </div>
  </section>
</template>
