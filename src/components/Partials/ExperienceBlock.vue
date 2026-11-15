<script setup>
defineProps({
  entry: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <li
    class="experience-block"
    :class="`experience-block--${entry.id}`"
    :aria-labelledby="`experience-${entry.id}`"
  >
    <span v-if="entry.year" class="experience-block__year" aria-hidden="true">{{
      entry.year
    }}</span>
    <p v-if="entry.category" class="experience-block__category">
      {{ entry.category }}
    </p>
    <p v-if="entry.period" class="experience-block__period">
      {{ entry.period }}
    </p>

    <div class="experience-block__identity">
      <h3 :id="`experience-${entry.id}`">{{ entry.organization }}</h3>
      <p v-if="entry.role" class="experience-block__role">{{ entry.role }}</p>
    </div>

    <ul v-if="entry.points.length" class="experience-block__points">
      <li v-for="(point, index) in entry.points" :key="index">
        {{ point }}
      </li>
    </ul>
  </li>
</template>

<style scoped lang="scss">
.experience-block {
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

  &__year {
    grid-column: 1;
    grid-row: 1;
    padding-top: 3px;
    font:
      24px/1 "Determination",
      monospace;
    color: var(--main-color);
  }

  &--education &__year {
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
    & {
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
