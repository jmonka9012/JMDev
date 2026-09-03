<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { runScrambleLoop } from "../../utils/scrambleLetter.js";

const props = defineProps({
  text: { type: String, default: "" }
})

const letters = ref([]);
const wrapper = ref(null);

const initLetters = () => {
  const content = props.text || (wrapper.value ? wrapper.value.textContent.trim() : "");

  letters.value = Array.from(content).map(char => ({
    char,
    isWhitespace: /\s/.test(char),
    hasInteracted: false,
    state: {
      isActive: false,
      originalChar: char
    },
    stopTimeout: null,
    el: null
  }));
};

const handleMouseEnter = (item) => {
  if (item.isWhitespace) return;

  item.hasInteracted = true;

  // KLUCZ: Jeśli istniał timer kończący animację - kasujemy go!
  if (item.stopTimeout) {
    clearTimeout(item.stopTimeout);
    item.stopTimeout = null;
  }

  // Jeśli animacja nie trwa - odpalamy
  if (!item.state.isActive) {
    item.state.isActive = true;
    runScrambleLoop(item.state, item.el);
  }
};

const handleMouseLeave = (item) => {
  if (item.isWhitespace || !item.state.isActive) return;

  item.stopTimeout = setTimeout(() => {
    item.state.isActive = false;
    if (item.el) item.el.textContent = item.state.originalChar;
    item.stopTimeout = null;
  }, 500);
};

onMounted(() => {
  initLetters();
});

onUnmounted(() => {
  letters.value.forEach(item => {
    if (item.stopTimeout) clearTimeout(item.stopTimeout);
  });
});
</script>

<template>
  <span ref="wrapper" class="hover-scramble" :class="{ 'loaded': letters.length > 0 }">
    <span
        v-for="(item, index) in letters"
        :key="index"
        :ref="el => item.el = el"
        :class="{
        'whitespace': item.isWhitespace,
        'has-interacted': item.hasInteracted
      }"
        @mouseenter="handleMouseEnter(item)"
        @mouseleave="handleMouseLeave(item)"
    >
      {{ item.char }}
    </span>
    <span v-if="letters.length === 0"><slot /></span>
  </span>
</template>

<style lang="scss">
@import "../../SCSS/_scramble.scss";

.hover-scramble.loaded {
  display: inline-block; // Poprawia wydajność renderowania tekstu

  span {
    display: inline-block; // Konieczne dla poprawnego działania animacji i transformacji
    white-space: pre; // Zachowuje spacje

    &:hover {
      background-color: white;
      color: black;
      transition: background-color 0.2s ease;
    }

    &.has-interacted:not(:hover) {
      animation: fade-out-sequence .5s forwards;
    }
  }
}
</style>