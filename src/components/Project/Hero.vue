<script setup>
import ScrambleText from "../Partials/ScrambleText.vue";
import Slider from "./Slider.vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  gallery: {
    type: Array,
    default: () => [],
  },
  manifest: {
    type: Object,
    default: () => ({}),
  },
  copy: {
    type: Object,
    required: true,
  },
  hasChallenges: Boolean,
});
</script>

<template>
  <header class="project-hero project-section container">
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
      class="project-hero__gallery"
      :slides="gallery"
      :manifest="manifest"
      :copy="copy"
      layout="split"
      eager
    />
  </header>
</template>

<style scoped lang="scss">
.project-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.5fr);
  column-gap: 54px;
  row-gap: var(--project-hero-gap, 0px);
  align-items: start;

  &__intro {
    display: contents;
  }

  &__eyebrow {
    grid-column: 1 / -1;
    grid-row: 1;
    display: flex;
    justify-content: space-between;
    padding-bottom: 18px;
    color: var(--main-color);
  }

  &__title {
    grid-column: 1 / -1;
    grid-row: 2;
    padding-block: var(--project-title-top, 0px)
      var(--project-title-bottom, 36px);

    :deep(h1) {
      font-size: clamp(40px, 8vw, var(--project-title-size, 100px));
    }
  }

  &__subtitle {
    grid-column: 1 / -1;
    grid-row: 3;
    max-width: 64ch;
    margin-bottom: var(--project-description-bottom, 92px);
    font-size: 26px;
    color: #d5dfd2;
  }

  &__gallery {
    grid-column: 2;
    grid-row: 4;
    width: 100%;
  }

  &__jump {
    grid-column: 1;
    grid-row: 4;
    align-self: end;
    justify-self: start;
    padding-block: 8px;
    border-bottom: 1px solid var(--main-color);
  }

  @media (max-width: 767px) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--project-hero-gap, 0px);

    &__subtitle {
      font-size: 24px;
    }
    &__jump {
      align-self: start;
    }
    &__gallery {
      order: 1;
    }
  }
}
</style>
