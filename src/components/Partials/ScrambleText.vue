<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useVisibility } from "../../utils/useVisibility.js";
import { useScramble } from "../../utils/useScramble.js";

const props = defineProps({
  tag: { type: String, default: 'span' },
  text: { type: String, required: true },
  scrambleTime: { type: Number, default: 500 },
  stagger: { type: Number, default: 40 },
  mode: { type: String, default: 'write' },
  flash: { type: Object, default: () => ({ from: 320, to: 500 }) },
  once: { type: Boolean, default: true },
  wrapWords: { type: Boolean, default: true },
  autoplay: { type: Boolean, default: true } // NOWY PROP
});

const wrapper = ref(null);
const letters = ref([]);
const groupedWords = ref([]);
const hasAnimated = ref(false);
const isVisible = useVisibility(wrapper);

const { launchWriteAnimation, launchFlashAnimation, clearTimeouts } = useScramble();

const triggerAnimation = async () => {
  clearTimeouts();

  letters.value.forEach(item => item.visible = false);

  await nextTick();

  if (props.mode === 'write') {
    launchWriteAnimation(letters, { scrambleTime: props.scrambleTime, stagger: props.stagger });
  } else if (props.mode === 'flash') {
    launchFlashAnimation(letters, { flash: props.flash });
  }

  hasAnimated.value = true;
};

watch(isVisible, (newVal) => {
  if (!props.autoplay) return;

  if (newVal && (!props.once || !hasAnimated.value)) {
    triggerAnimation();
  }
});

defineExpose({
  play: triggerAnimation
});

onMounted(() => {
  letters.value = [];

  const parts = props.wrapWords ? props.text.split(/(\s+)/) : [props.text];

  groupedWords.value = parts.filter(p => p.length > 0).map(part => {
    const isWhitespace = /^\s+$/.test(part);

    const wordLetters = Array.from(part).map(char => {
      const item = {
        original: char,
        state: { isActive: true, originalChar: char },
        el: null,
        visible: false
      };

      letters.value.push(item);
      return item;
    });

    return { isWhitespace, letters: wordLetters };
  });
});

onUnmounted(() => {
  clearTimeouts();
});
</script>
<template>
  <component :is="tag" ref="wrapper" class="scramble-wrapper">
    <span
        v-for="(word, wIndex) in groupedWords"
        :key="wIndex"
        :class="{ 'word': wrapWords && !word.isWhitespace }"
    >
      <span
          v-for="(item, index) in word.letters"
          :key="`${wIndex}-${index}`"
          :ref="el => { if (el) item.el = el }"
          class="letter"
          :class="{ 'is-visible': item.visible }"
      >
        {{ item.visible ? '' : '&nbsp;' }}
      </span>
    </span>
  </component>
</template>

<style lang="scss" scoped>
@import "../../SCSS/_scramble.scss";

.scramble-wrapper {

  padding: 0;

  .word {
    display: inline-block;
    white-space: nowrap; // Kluczowy parametr: zabrania łamania słowa wpół
  }

  .letter {
    display: inline-block;
    white-space: pre; // Szanujemy twarde spacje
    min-width: 0.1ch;
    opacity: 0;

    &.is-visible {
      opacity: 1;
      animation: fade-out-sequence 0.5s forwards;
    }
  }
}
</style>