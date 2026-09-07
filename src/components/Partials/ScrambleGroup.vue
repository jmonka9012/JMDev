<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { runScrambleLoop } from "../../utils/useScramble.js";
import { randomArrayItem } from "../../utils/randomArrayItem.js";
import { useVisibility } from "../../utils/useVisibility.js";
import { motionPaused } from "../../utils/motionPreference.js";

const container = ref();
const isVisible = useVisibility(container);

const props = defineProps({
  words: { type: Array, required: true },
  suffixes: { type: Array, required: true },
  scrambleTime: { type: Number, default: 500 },
  interval: { type: Number, default: 3000 },
});

const accessibleText = props.words.find((word) => word.length > 0) || "";
let lastWord = "";
const appendableStrings = props.suffixes
  ? props.suffixes
  : [" <3", " :)", "!", "."];
const currentLetters = ref(
  Array.from(accessibleText).map((char) => ({
    state: { isActive: false, originalChar: char },
    el: null,
    visible: true,
  })),
);
const isWaiting = ref(false);
const isEnhanced = ref(false);
let sequenceRun = 0;
const stopTimeouts = new Set();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sequenceIsActive = (run) =>
  isActive && run === sequenceRun && !motionPaused.value;

const restoreStableText = () => {
  sequenceRun += 1;
  stopTimeouts.forEach(clearTimeout);
  stopTimeouts.clear();
  isWaiting.value = false;

  currentLetters.value.forEach((item) => {
    item.state.isActive = false;
  });

  currentLetters.value = Array.from(accessibleText).map((char) => ({
    state: { isActive: false, originalChar: char },
    el: null,
    visible: true,
  }));
};

const animateSequence = async (chars, run) => {
  if (!sequenceIsActive(run)) return false;
  const startIndex = currentLetters.value.length;

  const newItems = Array.from(chars).map((char) => ({
    state: { isActive: true, originalChar: char },
    el: null,
    visible: false,
  }));

  currentLetters.value.push(...newItems);

  await nextTick();

  for (let i = startIndex; i < currentLetters.value.length; i++) {
    if (!sequenceIsActive(run)) return false;
    const item = currentLetters.value[i];
    if (!item) continue;

    item.visible = true;
    runScrambleLoop(item.state, item.el);

    const stopTimeout = setTimeout(() => {
      stopTimeouts.delete(stopTimeout);
      item.state.isActive = false;
      if (item.el) item.el.innerText = item.state.originalChar;
    }, props.scrambleTime);
    stopTimeouts.add(stopTimeout);

    await sleep(70);
  }

  return sequenceIsActive(run);
};

const writeWord = async (word, run) => {
  currentLetters.value = [];

  if (!(await animateSequence(word, run))) return false;

  if (Math.random() > 0.5) {
    await sleep(1000);
    if (!sequenceIsActive(run)) return false;
    const chosenString = randomArrayItem(appendableStrings);
    if (!(await animateSequence(chosenString, run))) return false;
  }

  return true;
};

const deleteWord = async (run) => {
  for (let i = currentLetters.value.length - 1; i >= 0; i--) {
    await sleep(40);
    if (!sequenceIsActive(run)) return false;
    currentLetters.value[i].visible = false;
  }
  currentLetters.value = [];
  return true;
};

let isActive;

const cycleWords = async () => {
  while (isActive) {
    if (isVisible.value && !motionPaused.value) {
      const run = sequenceRun;
      let word = randomArrayItem(props.words);

      while (props.words.length > 1 && word === lastWord) {
        word = randomArrayItem(props.words);
      }

      lastWord = word;

      if (!(await writeWord(word, run))) continue;

      isWaiting.value = true; // Flag used for cursor blinking.
      await sleep(props.interval);
      if (!sequenceIsActive(run)) continue;
      isWaiting.value = false;

      await deleteWord(run);
    }
    await sleep(500);
  }
};

onMounted(() => {
  isActive = true;
  isEnhanced.value = true;
  cycleWords();
});

watch(motionPaused, (isPaused) => {
  if (isPaused) restoreStableText();
});

onUnmounted(() => {
  isActive = false;
  restoreStableText();
});
</script>

<template>
  <div ref="container" class="scramble-container">
    <span :class="{ 'visually-hidden': isEnhanced && !motionPaused }">
      {{ accessibleText }}
    </span>
    <div
      v-if="isEnhanced && !motionPaused"
      class="scramble-group"
      aria-hidden="true"
    >
      <span
        v-for="(item, index) in currentLetters"
        :key="index"
        :ref="
          (el) => {
            if (el) item.el = el;
          }
        "
        class="letter"
        :class="{ 'is-visible': item.visible }"
      >
        {{ item.state.originalChar }}
      </span>
      <span class="writing-cursor" :class="{ blinking: isWaiting }"></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../SCSS/_scramble.scss";

.scramble-container {
  display: flex;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.scramble-group {
  display: inline-flex; // Flexbox prevents the cursor from jumping.
  align-items: center;
  position: relative;
  min-height: 1.2em;

  .letter {
    display: none; // Hidden until the animation starts.
    color: white;
    min-width: 1ch;
    white-space: pre;

    &.is-visible {
      display: inline-block;
      animation: fade-out-sequence 0.5s forwards;
    }
  }
}

@keyframes cursor-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.writing-cursor {
  display: inline-block;
  width: 3px;
  height: 1.2em;
  background-color: #fff;
  margin-left: 2px;
  vertical-align: middle;

  &.blinking {
    animation: cursor-blink 1s step-start infinite;
  }
}
</style>
