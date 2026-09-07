<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useVisibility } from "../../utils/useVisibility.js";
import { useScramble } from "../../utils/useScramble.js";
import { motionPaused } from "../../utils/motionPreference.js";

const props = defineProps({
  tag: { type: String, default: "span" },
  text: { type: String, required: true },
  scrambleTime: { type: Number, default: 500 },
  stagger: { type: Number, default: 40 },
  mode: { type: String, default: "write" },
  flash: { type: Object, default: () => ({ from: 320, to: 500 }) },
  once: { type: Boolean, default: true },
  wrapWords: { type: Boolean, default: true },
  autoplay: { type: Boolean, default: true },
});

const createTextLayers = () => {
  const allLetters = [];
  const parts = props.wrapWords ? props.text.split(/(\s+)/) : [props.text];
  const words = parts
    .filter((part) => part.length > 0)
    .map((part) => {
      const isWhitespace = /^\s+$/.test(part);
      const wordLetters = Array.from(part).map((char) => {
        const item = {
          original: char,
          state: { isActive: false, originalChar: char },
          el: null,
          visible: false,
        };

        allLetters.push(item);
        return item;
      });

      return { isWhitespace, letters: wordLetters };
    });

  return { allLetters, words };
};

const initialLayers = createTextLayers();
const wrapper = ref(null);
const letters = ref(initialLayers.allLetters);
const groupedWords = ref(initialLayers.words);
const hasAnimated = ref(false);
const isAnimating = ref(false);
const isEnhanced = ref(false);
const isVisible = useVisibility(wrapper);
const { launchWriteAnimation, launchFlashAnimation, clearTimeouts } =
  useScramble();

let animationEndTimeout;
let animationRun = 0;

const finishAnimationAfter = (delay, run) => {
  animationEndTimeout = setTimeout(() => {
    if (run === animationRun) isAnimating.value = false;
  }, delay);
};

const showStableText = () => {
  animationRun += 1;
  clearTimeout(animationEndTimeout);
  clearTimeouts();
  isAnimating.value = false;
  hasAnimated.value = true;

  letters.value.forEach((item) => {
    item.state.isActive = false;
    item.visible = true;
    if (item.el) item.el.textContent = item.state.originalChar;
  });
};

const triggerAnimation = async () => {
  if (motionPaused.value) {
    showStableText();
    return;
  }

  const run = ++animationRun;
  clearTimeouts();
  clearTimeout(animationEndTimeout);
  isAnimating.value = true;
  letters.value.forEach((item) => {
    item.state.isActive = false;
    item.visible = false;
  });

  await nextTick();

  if (props.mode === "write") {
    await launchWriteAnimation(letters, {
      scrambleTime: props.scrambleTime,
      stagger: props.stagger,
      shouldStop: () => run !== animationRun,
    });
    if (run !== animationRun) return;
    finishAnimationAfter(Math.max(props.scrambleTime - props.stagger, 0), run);
  } else if (props.mode === "flash") {
    await launchFlashAnimation(letters, {
      flash: props.flash,
      shouldStop: () => run !== animationRun,
    });
    if (run !== animationRun) return;
    finishAnimationAfter(props.flash.to, run);
  } else {
    isAnimating.value = false;
  }

  hasAnimated.value = true;
};

watch(isVisible, (newVal) => {
  if (!props.autoplay) return;

  if (newVal && (!props.once || !hasAnimated.value)) {
    triggerAnimation();
  }
});

watch(motionPaused, (isPaused) => {
  if (isPaused) showStableText();
});

defineExpose({
  play: triggerAnimation,
});

onMounted(() => {
  isEnhanced.value = true;
});

onUnmounted(() => {
  showStableText();
});
</script>

<template>
  <component
    :is="tag"
    ref="wrapper"
    class="scramble-wrapper"
    :class="{ 'is-animating': isAnimating }"
  >
    <span class="scramble-text">{{ text }}</span>
    <span v-if="isEnhanced" class="scramble-animation" aria-hidden="true">
      <span
        v-for="(word, wIndex) in groupedWords"
        :key="wIndex"
        :class="{ word: wrapWords && !word.isWhitespace }"
      >
        <span
          v-for="(item, index) in word.letters"
          :key="`${wIndex}-${index}`"
          :ref="
            (el) => {
              if (el) item.el = el;
            }
          "
          class="letter"
          :class="{ 'is-visible': item.visible }"
        >
          {{ item.original }}
        </span>
      </span>
    </span>
  </component>
</template>

<style lang="scss" scoped>
@import "../../SCSS/_scramble.scss";

.scramble-wrapper {
  position: relative;
  padding: 0;

  &.is-animating {
    .scramble-text {
      color: transparent;
    }

    .scramble-animation {
      opacity: 1;
    }
  }
}

.scramble-animation {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;

  .word {
    display: inline-block;
    white-space: nowrap;
  }

  .letter {
    display: inline-block;
    min-width: 0.1ch;
    opacity: 0;
    white-space: pre;

    &.is-visible {
      opacity: 1;
      animation: fade-out-sequence 0.5s forwards;
    }
  }
}
</style>
