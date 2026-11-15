<script setup>
import { computed, onMounted, onUnmounted } from "vue";

import ScrollBracketContainer from "./Partials/ScrollBracketContainer.vue";
import ScrambleText from "./Partials/ScrambleText.vue";

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
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="experience__entry"
        :class="`experience__entry--${entry.id}`"
        :aria-labelledby="`experience-${entry.id}`"
      >
        <span v-if="entry.year" class="experience__year" aria-hidden="true">{{
          entry.year
        }}</span>
        <p v-if="entry.category" class="experience__category">
          {{ entry.category }}
        </p>
        <p v-if="entry.period" class="experience__period">{{ entry.period }}</p>

        <div class="experience__identity">
          <h3 :id="`experience-${entry.id}`">{{ entry.organization }}</h3>
          <p v-if="entry.role" class="experience__role">{{ entry.role }}</p>
        </div>

        <ul v-if="entry.points.length" class="experience__points">
          <li v-for="(point, index) in entry.points" :key="index">
            {{ point }}
          </li>
        </ul>
      </li>
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

  &__entry {
    position: relative;
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;
    align-items: start;
    gap: 12px 44px;
    min-width: 0;
    padding: 0 0 44px;

    &::before {
      content: "";
      position: absolute;
      left: 180px;
      top: 7px;
      bottom: 0;
      width: 1px;
      background: #ffffff50;
    }

    &::after {
      content: "";
      position: absolute;
      left: 176px;
      top: 7px;
      width: 9px;
      height: 9px;
      border: 2px solid var(--main-color);
      background: #000;
    }

    &:last-child::before {
      bottom: 35px;
    }
    &--education::after {
      border-color: #f6fff4;
    }
  }

  &__year {
    grid-column: 1;
    grid-row: 1;
    padding-top: 3px;
    font:
      24px/1 "Determination",
      monospace;
    color: var(--main-color);
  }

  &__entry--education &__year {
    color: #f6fff4;
  }

  &__category {
    grid-column: 1;
    grid-row: 2;
    padding-right: 16px;
    font: 10px/1.5 monospace;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #b1c0ab;
  }

  &__period {
    grid-column: 1;
    grid-row: 3;
    padding-right: 24px;
    font: 12px/1.6 monospace;
    color: #f6fff4;
  }

  &__identity {
    grid-column: 2;
    grid-row: 1 / 3;
    min-width: 0;
    padding-left: 12px;

    h3 {
      font:
        34px/1.1 "Jersey 10",
        monospace;
      overflow-wrap: anywhere;
    }
  }

  &__role {
    margin-top: 8px;
    font:
      24px/1.25 "Jersey 10",
      monospace;
    color: #c9d5c5;
  }

  &__points {
    grid-column: 2;
    grid-row: 3;
    display: grid;
    gap: 12px;
    min-width: 0;
    margin: 0;
    padding: 0 0 0 12px;
    list-style: none;

    li {
      padding: 0 0 0 18px;
      font:
        17px/1.6 Arial,
        sans-serif;
      color: #d9e0d6;
      overflow-wrap: anywhere;
    }
    li::before {
      top: 13px;
      width: 4px;
      height: 4px;
      background: #76966c;
    }
  }

  @media (max-width: 600px) {
    &__header {
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    &__chronology {
      font-size: 10px;
    }

    &__entry {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      padding-left: 24px;

      &::before {
        left: 0;
      }
      &::after {
        left: -4px;
      }
    }

    &__year {
      grid-column: 1;
      grid-row: 1;
      margin-bottom: 6px;
      font-size: 22px;
    }
    &__category {
      grid-column: 1;
      grid-row: 2;
      padding: 0;
    }
    &__period {
      grid-column: 1;
      grid-row: 3;
      padding: 0;
    }
    &__identity {
      grid-column: 1;
      grid-row: 4;
      padding: 0;
    }
    &__identity h3 {
      font-size: 30px;
    }
    &__role {
      font-size: 22px;
    }
    &__points {
      grid-column: 1;
      grid-row: 5;
      margin-top: 10px;
      padding: 0;
    }
  }
}
</style>
