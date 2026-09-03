<script setup>
import {ref, nextTick, watch, onUnmounted, onMounted} from 'vue';
import { useElementsRegistry} from "../utils/useRegistry.js";
const { registerElement, unregisterElement } = useElementsRegistry();
import {useVisibility} from "../utils/useVisibility.js";
import ScrollBevelContainer from "../components/Partials/ScrollBevelContainer.vue";
import ScrambleText from "./Partials/ScrambleText.vue";

const myId = 'technologies';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  dataOther: {
    type: Object,
    required: false
  },
  technologies: {
    type: Object,
    required: true
  },
  svgAnimationClass: {
    type: String,
    default: 'is-animating'
  },
  glowInterval: {
    type: Number,
    default: 800 // co ile ms losujemy nową technologię do podświetlenia
  },
  glowDuration: {
    type: Number,
    default: 1500 // jak długo dana technologia się świeci
  }
})

const wrapper = ref(null);
const techTitleRefs = ref([]);
const isVisible = useVisibility(wrapper);
const hasPlayed = ref(false);

const activeSvgIndexes = ref(new Set());
const glowIndexes = ref(new Set());

let glowIntervalId = null;
let glowTimeouts = [];

const clearGlowTimeouts = () => {
  glowTimeouts.forEach(clearTimeout);
  glowTimeouts = [];
};

const setTechTitleRef = (el) => {
  if (el && !techTitleRefs.value.includes(el)) {
    techTitleRefs.value.push(el);
  }
};

// Funkcja losująca i podświetlająca technologię
const triggerRandomGlow = () => {
  const count = techTitleRefs.value.length;
  if (count === 0) return;

  const availableIndexes = [];
  for (let i = 0; i < count; i++) {
    if (!glowIndexes.value.has(i)) {
      availableIndexes.push(i);
    }
  }

  if (availableIndexes.length === 0) return;

  const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

  // Zapalamy!
  glowIndexes.value.add(randomIndex);

  // Gasimy po określonym czasie
  const offTimer = setTimeout(() => {
    glowIndexes.value.delete(randomIndex);
  }, props.glowDuration);

  glowTimeouts.push(offTimer);
};

const startRandomGlowLoop = () => {
  if (glowIntervalId) return;
  triggerRandomGlow(); // Odpalamy od razu pierwszy
  glowIntervalId = setInterval(triggerRandomGlow, props.glowInterval);
};

const stopRandomGlowLoop = () => {
  if (glowIntervalId) {
    clearInterval(glowIntervalId);
    glowIntervalId = null;
  }
  clearGlowTimeouts();
  glowIndexes.value.clear();
};

const playTechTitles = async () => {
  await nextTick();

  techTitleRefs.value.forEach((comp, index) => {
    setTimeout(() => {
      comp.play();
      activeSvgIndexes.value.add(index);
    }, index * 150);
  });

  const revealDuration = techTitleRefs.value.length * 150 + 300; // 300 = scrambleTime ikon tekstu
  setTimeout(startRandomGlowLoop, revealDuration);
};

watch(isVisible, (newVal) => {
  if (newVal && !hasPlayed.value) {
    hasPlayed.value = true;
    playTechTitles();
  } else if (newVal && hasPlayed.value) {
    startRandomGlowLoop();
  } else if (!newVal) {
    stopRandomGlowLoop();
  }
});

onMounted(() => {
  registerElement({
    id: myId,
    title: props.data.menu_name,
  });
});

onUnmounted(() => {
  stopRandomGlowLoop();
  unregisterElement(myId);
});
</script>

<template>
  <ScrollBevelContainer :id="myId">
    <div>
      <ScrambleText class="mb-15" tag="h2" mode="write" :text="data.heading"></ScrambleText>
      <ScrambleText class="text-lg text-justify mb-15" tag="div" mode="write" :wrap-words="true" :stagger="1" :scramble-time="150" :text="data.text"></ScrambleText>
      <div ref="wrapper" class="tech-cont">
        <div class="tech" v-for="(tech, index) in technologies" :key="tech.id">
          <div
              class="tech__svg"
              :class="{
              [svgAnimationClass]: activeSvgIndexes.has(index),
              'is-glowing': glowIndexes.has(index)
            }"
          >
            <img v-svg-inject :src="tech.featured_media" alt="">
          </div>
          <ScrambleText
              :ref="setTechTitleRef"
              tag="h5"
              mode="write"
              class="tech__title"
              :text="tech.title"
              :scramble-time="300"
              :autoplay="false"
          ></ScrambleText>
        </div>
      </div>
    </div>

    <div v-if="dataOther">
      <ScrambleText class="mb-15" tag="h2" mode="write" :text="dataOther.heading"></ScrambleText>
      <div v-html="dataOther.text" class="strengths-wysiwyg ul--big"></div>
    </div>

  </ScrollBevelContainer>
</template>

<style lang="scss">
.tech-cont {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 50px;

  @include media-breakpoint-down(xl) {
    grid-template-columns: repeat(3, 1fr);
  }

  @include media-breakpoint-down(lg) {
    grid-template-columns: repeat(1, 1fr);
    gap: 30px;
  }
}

.tech {
  display: grid;
  grid-template-columns: 75px 1fr;
  width: 100%;
  gap: 20px;
  align-items: center;

  &__title {
    font-size: 30px;
    line-height: 1.4;
  }

  &__svg {
    svg {
      fill: #fff !important;
      width: 100%;
      height: auto;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 0.4s ease, transform 0.4s ease, fill 0.4s ease;
    }

    path {
      fill: #fff !important;
      transition: fill 0.4s ease;
    }

    &.is-animating svg {
      opacity: 1;
      transform: scale(1);
    }

    &.is-glowing svg,
    &.is-glowing path {
      fill: var(--main-color) !important;
    }
  }

  &:hover &__svg svg,
  &:hover &__svg path {
    fill: var(--main-color) !important;
  }

  @include media-breakpoint-down(lg) {
    grid-template-columns: 40px 1fr;
    gap: 20px;

    &__title {
      font-size: 20px;
    }

    &__svg {
      width: 40px;
    }
  }
}

.strengths-wysiwyg {
  ul {
    @include media-breakpoint-up(lg) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
}
</style>