<script setup>
import ScrambleText from "../Partials/ScrambleText.vue";
import Slider from "./Slider.vue";
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  gallery: { type: Array, default: () => [] },
  manifest: { type: Object, default: () => ({}) },
  copy: { type: Object, required: true },
  hasChallenges: Boolean,
});
</script>
<template>
  <header class="project-hero project-hero--C container">
    <div class="project-hero__intro">
      <div class="project-micro project-hero__eyebrow">
        <span>{{ copy.study }}</span
        ><span aria-hidden="true">↘</span>
      </div>
      <div class="project-hero__title">
        <ScrambleText tag="h1" :text="title" />
      </div>
      <div
        v-if="subtitle"
        class="project-hero__subtitle project-rich"
        v-html="subtitle"
      ></div>
      <a
        v-if="hasChallenges"
        class="project-hero__jump project-micro"
        href="#project-challenges"
        >{{ copy.challenges }} ↓</a
      >
    </div>
    <Slider
      :slides="gallery"
      :manifest="manifest"
      :copy="copy"
      layout="split"
      eager
    />
  </header>
</template>
