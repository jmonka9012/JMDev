<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { runScrambleLoop } from "../../utils/useScramble.js";
import { motionPaused } from "../../utils/motionPreference.js";

const props = defineProps({
  text: { type: String, default: "" },
});

const letters = ref(
  Array.from(props.text).map((char) => ({
    char,
    isWhitespace: /\s/.test(char),
    hasInteracted: false,
    state: {
      isActive: false,
      originalChar: char,
    },
    stopTimeout: null,
    el: null,
  })),
);
const isEnhanced = ref(false);

const stopScrambling = () => {
  letters.value.forEach((item) => {
    item.state.isActive = false;
    item.hasInteracted = false;
    if (item.stopTimeout) clearTimeout(item.stopTimeout);
    item.stopTimeout = null;
    if (item.el) item.el.textContent = item.state.originalChar;
  });
};

const handleMouseEnter = (item) => {
  if (item.isWhitespace || motionPaused.value) return;

  item.hasInteracted = true;

  if (item.stopTimeout) {
    clearTimeout(item.stopTimeout);
    item.stopTimeout = null;
  }

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
  isEnhanced.value = true;
});

watch(motionPaused, (isPaused) => {
  if (isPaused) stopScrambling();
});

onUnmounted(() => {
  stopScrambling();
});
</script>

<template>
  <span
    class="hover-scramble"
    :class="{ 'is-enhanced': isEnhanced && !motionPaused }"
  >
    <span class="hover-scramble__text">
      <template v-if="text">{{ text }}</template>
      <slot v-else />
    </span>
    <span
      v-if="text && isEnhanced && !motionPaused"
      class="hover-scramble__animation"
      aria-hidden="true"
    >
      <span
        v-for="(item, index) in letters"
        :key="index"
        :ref="(el) => (item.el = el)"
        class="hover-scramble__letter"
        :class="{ 'has-interacted': item.hasInteracted }"
        @mouseenter="handleMouseEnter(item)"
        @mouseleave="handleMouseLeave(item)"
      >
        {{ item.char }}
      </span>
    </span>
  </span>
</template>

<style lang="scss" scoped>
@import "../../SCSS/_scramble.scss";

.hover-scramble {
  position: relative;
  display: inline-block;
  white-space: nowrap;

  &.is-enhanced {
    .hover-scramble__text {
      color: transparent;
    }

    .hover-scramble__animation {
      opacity: 1;
      pointer-events: auto;
    }
  }
}

.hover-scramble__animation {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;

  .hover-scramble__letter {
    display: inline-block;
    white-space: pre;

    &:hover {
      color: black;
      background-color: white;
      transition: background-color 0.2s ease;
    }

    &.has-interacted:not(:hover) {
      animation: fade-out-sequence 0.5s forwards;
    }
  }
}
</style>
