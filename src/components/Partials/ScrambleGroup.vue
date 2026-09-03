<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { runScrambleLoop } from "../../utils/useScramble.js";
import { randomArrayItem } from "../../utils/randomArrayItem.js";
import { useVisibility } from "../../utils/useVisibility.js";

const container = ref();
const isVisible = useVisibility(container);

const props = defineProps({
  words: { type: Array, required: true },
  suffixes: { type: Array, required: true },
  scrambleTime: { type: Number, default: 500 },
  interval: { type: Number, default: 3000 },
})

let lastWord = '';
const appendableStrings = props.suffixes ? props.suffixes : [' <3', " :)", "!", "."];
const currentLetters = ref([]);
const isWaiting = ref(false);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const animateSequence = async (chars) => {
  const startIndex = currentLetters.value.length;

  const newItems = Array.from(chars).map(char => ({
    state: { isActive: true, originalChar: char },
    el: null,
    visible: false,
  }));

  currentLetters.value.push(...newItems);

  await nextTick();

  for (let i = startIndex; i < currentLetters.value.length; i++) {
    const item = currentLetters.value[i];
    if (!item) continue;

    item.visible = true;
    runScrambleLoop(item.state, item.el);

    setTimeout(() => {
      item.state.isActive = false;
      if (item.el) item.el.innerText = item.state.originalChar;
    }, props.scrambleTime);

    await sleep(70);
  }
};

const writeWord = async (word) => {
  currentLetters.value = [];

  await animateSequence(word);

  if (Math.random() > 0.5) {
    await sleep(1000);
    const chosenString = randomArrayItem(appendableStrings);
    await animateSequence(chosenString);
  }
};

const deleteWord = async () => {
  for (let i = currentLetters.value.length - 1; i >= 0; i--) {
    await sleep(40);
    currentLetters.value[i].visible = false;
  }
  currentLetters.value = [];
};

let isActive;

const cycleWords = async () => {
  while (isActive) {
    if (isVisible.value) {
      let word = randomArrayItem(props.words);

      while (word === lastWord) {
        word = randomArrayItem(props.words);
      }

      lastWord = word;

      await writeWord(word);

      isWaiting.value = true; // Flaga dla mrugania kursora
      await sleep(props.interval);
      isWaiting.value = false;

      await deleteWord();
    }
    await sleep(500);
  }
};

onMounted(() => {
  isActive = true;
  cycleWords();
});

onUnmounted(() => {
  isActive = false;
});
</script>

<template>
  <div ref="container" class="scramble-container">
    <div class="scramble-group">
      <span
          v-for="(item, index) in currentLetters"
          :key="index"
          :ref="el => { if (el) item.el = el }"
          class="letter"
          :class="{ 'is-visible': item.visible }"
      >
        &nbsp;
      </span>
      <span class="writing-cursor" :class="{ 'blinking': isWaiting }"></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "../../SCSS/_scramble.scss";

.scramble-container {
  display: flex;
}

.scramble-group {
  display: inline-flex; // Flexbox sprawia, że kursor nie skacze
  align-items: center;
  position: relative;
  min-height: 1.2em;

  .letter {
    display: none; // Ukryty, dopóki nie zacznie się animować
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
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