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
  gap: 10px;
  margin-bottom: 32px;

  button {
    min-height: 44px;
    padding: 12px 18px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #b4c2b4;
    font: inherit;
    font-size: 25px;
    line-height: 1.2;
    text-align: left;

    &:hover {
      color: #35ff25;
    }

    &[aria-pressed="true"] {
      background: #f6fff4;
      color: #000;
      box-shadow: -3px -3px 0 #35ff25;
    }

    &:focus-visible {
      outline: 2px solid #35ff25;
      outline-offset: 5px;
    }
  }

  @include media-breakpoint-down(lg) {
    gap: 8px;
    button {
      padding: 10px 12px;
      font-size: 22px;
    }
  }
}
</style>
