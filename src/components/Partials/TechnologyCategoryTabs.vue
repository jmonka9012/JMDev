<script setup>
import { categoryKeyAt } from "../../utils/technologyCategories.js";

const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, default: "" },
  lang: { type: String, default: "pl" },
});
const emit = defineEmits(["update:modelValue"]);
const buttons = new Map();

const onKeydown = (event) => {
  const key = categoryKeyAt(props.categories, props.modelValue, event.key);
  if (!key) return;
  event.preventDefault();
  emit("update:modelValue", key);
  buttons.get(key)?.focus();
};
</script>

<template>
  <div
    class="technology-categories"
    role="group"
    :aria-label="
      lang === 'pl' ? 'Kategorie technologii' : 'Technology categories'
    "
  >
    <button
      v-for="category in categories"
      :id="`technology-category-${category.key}`"
      :key="category.key"
      :ref="
        (el) =>
          el ? buttons.set(category.key, el) : buttons.delete(category.key)
      "
      type="button"
      :aria-pressed="modelValue === category.key"
      aria-controls="technology-items"
      @click="emit('update:modelValue', category.key)"
      @keydown="onKeydown"
    >
      {{ category.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.technology-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 28px;
  padding-bottom: 24px;
  margin-bottom: 48px;
  border-bottom: 1px solid #344233;

  button {
    --tab-layer-opacity: 0;
    --tab-layer-offset: 10px;
    --tab-text-color: #b4c2b4;
    position: relative;
    isolation: isolate;
    min-height: 44px;
    padding: 12px 18px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--tab-text-color);
    font: inherit;
    font-size: 25px;
    line-height: 1.2;
    text-align: left;
    transition: color 0.25s ease-out;

    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      opacity: var(--tab-layer-opacity);
      transition:
        opacity 0.25s ease-out,
        transform 0.25s ease-out;
    }

    &::before {
      background: #35ff25;
      transform: translate(
        calc(-1 * var(--tab-layer-offset)),
        calc(-1 * var(--tab-layer-offset))
      );
    }

    &::after {
      background: #f6fff4;
      transform: translate(var(--tab-layer-offset), var(--tab-layer-offset));
    }

    &[aria-pressed="true"],
    &:hover,
    &:focus-visible {
      --tab-layer-opacity: 1;
      --tab-layer-offset: 2px;
      --tab-text-color: #000;
    }

    &:focus-visible {
      outline: 2px solid #35ff25;
      outline-offset: 5px;
    }
  }

  @include media-breakpoint-down(lg) {
    gap: 16px 18px;
    padding-bottom: 20px;
    margin-bottom: 40px;
    button {
      padding: 10px 12px;
      font-size: 22px;
    }
  }
}
</style>
