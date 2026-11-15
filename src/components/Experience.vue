<script setup>
import { computed, onMounted, onUnmounted } from "vue";

import ScrollBracketContainer from "./Partials/ScrollBracketContainer.vue";
import ScrambleText from "./Partials/ScrambleText.vue";
import ExperienceBlock from "./Partials/ExperienceBlock.vue";

import { fadeIn } from "../utils/animations.js";
import { experienceEntries } from "../utils/experienceContent.js";
import { useElementsRegistry } from "../utils/useRegistry.js";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  lang: {
    type: String,
    default: "pl",
  },
});

const { registerElement, unregisterElement } = useElementsRegistry();
const sectionId = "experience";

const entries = computed(() => experienceEntries(props.data, props.lang));
const chronologyLabel = computed(() =>
  props.lang === "en" ? "Ordered by starting date" : "Według daty rozpoczęcia",
);

const animateExperience = (element) => {
  fadeIn(element, 1.5, 0, 0, 0);
};

onMounted(() => {
  registerElement({ id: sectionId, title: props.data.menu_name });
});

onUnmounted(() => {
  unregisterElement(sectionId);
});
</script>

<template>
  <ScrollBracketContainer
    :id="sectionId"
    v-on-enter="animateExperience"
    class="experience"
    as="section"
    labelled-by="experience-heading"
  >
    <header class="experience__header">
      <ScrambleText id="experience-heading" tag="h2" :text="data.heading" />
    </header>

    <p class="experience__chronology">{{ chronologyLabel }} ↓</p>

    <ol class="experience__entries">
      <ExperienceBlock
        v-for="entry in entries"
        :key="entry.id"
        :entry="entry"
      />
    </ol>
  </ScrollBracketContainer>
</template>

<style scoped lang="scss">
.experience.container.scroll-bracket {
  padding: 40px 40px 48px;

  @media (max-width: 1023px) {
    padding: 30px 26px;
  }
  @media (max-width: 600px) {
    padding: 24px 20px;
  }
}

.experience {
  &__header {
    padding-bottom: 32px;
    margin-bottom: 40px;
    border-bottom: 1px solid #ffffff65;
  }

  &__chronology {
    margin-bottom: 28px;
    font: 12px/1.5 monospace;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #a8b5a4;
  }

  &__entries {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  @media (max-width: 600px) {
    &__header {
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    &__chronology {
      font-size: 10px;
    }
  }
}
</style>
