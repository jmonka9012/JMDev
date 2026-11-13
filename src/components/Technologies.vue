<script setup>
import { computed, ref, nextTick, watch, onUnmounted, onMounted } from "vue";
import { useElementsRegistry } from "../utils/useRegistry.js";
import { useVisibility } from "../utils/useVisibility.js";
import ScrollBracketContainer from "./Partials/ScrollBracketContainer.vue";
import ScrambleText from "./Partials/ScrambleText.vue";
import TechnologyCategoryTabs from "./Partials/TechnologyCategoryTabs.vue";
import { motionPaused } from "../utils/motionPreference.js";
import { groupTechnologies } from "../utils/technologyCategories.js";

const { registerElement, unregisterElement } = useElementsRegistry();
const myId = "technologies";
const props = defineProps({
  data: { type: Object, required: true },
  dataOther: { type: Object, required: false },
  technologies: { type: Array, required: true },
  lang: { type: String, default: "pl" },
  svgAnimationClass: { type: String, default: "is-animating" },
  glowInterval: { type: Number, default: 800 },
  glowDuration: { type: Number, default: 1500 },
});

const wrapper = ref(null);
const isVisible = useVisibility(wrapper);
const iconsReady = ref(false);
const selectedCategory = ref("");
const categories = computed(() =>
  groupTechnologies(props.technologies, props.lang),
);
const activeCategory = computed(
  () =>
    categories.value.find(
      (category) => category.key === selectedCategory.value,
    ) || categories.value[0],
);
const visibleTechnologies = computed(
  () => activeCategory.value?.technologies || [],
);
const titleRefs = new Map();
const revealedIds = ref(new Set());
const glowIds = ref(new Set());
let glowIntervalId;
const glowTimeouts = new Set();
const revealTimeouts = new Set();
let iconLoadObserver;
let animationRun = 0;

const clearRevealTimeouts = () => {
  revealTimeouts.forEach(clearTimeout);
  revealTimeouts.clear();
};
const stopRandomGlowLoop = () => {
  clearInterval(glowIntervalId);
  glowIntervalId = undefined;
  glowTimeouts.forEach(clearTimeout);
  glowTimeouts.clear();
  glowIds.value.clear();
};
const triggerRandomGlow = () => {
  if (motionPaused.value || !isVisible.value) return;
  const candidates = visibleTechnologies.value.filter(
    (tech) => revealedIds.value.has(tech.id) && !glowIds.value.has(tech.id),
  );
  if (!candidates.length) return;
  const id = candidates[Math.floor(Math.random() * candidates.length)].id;
  glowIds.value.add(id);
  const timeout = setTimeout(() => {
    glowIds.value.delete(id);
    glowTimeouts.delete(timeout);
  }, props.glowDuration);
  glowTimeouts.add(timeout);
};
const startRandomGlowLoop = () => {
  if (glowIntervalId || motionPaused.value || !isVisible.value) return;
  triggerRandomGlow();
  glowIntervalId = setInterval(triggerRandomGlow, props.glowInterval);
};
const revealAllTechnologies = () => {
  revealedIds.value = new Set(props.technologies.map((tech) => tech.id));
};
const playVisibleTitles = async (run) => {
  await nextTick();
  if (run !== animationRun || motionPaused.value || !isVisible.value) return;
  const pending = visibleTechnologies.value.filter(
    (tech) => !revealedIds.value.has(tech.id),
  );
  pending.forEach((tech, index) => {
    const timeout = setTimeout(() => {
      revealTimeouts.delete(timeout);
      if (run !== animationRun || motionPaused.value || !isVisible.value)
        return;
      titleRefs.get(tech.id)?.play();
      revealedIds.value.add(tech.id);
    }, index * 150);
    revealTimeouts.add(timeout);
  });
  const timeout = setTimeout(
    () => {
      revealTimeouts.delete(timeout);
      if (run === animationRun) startRandomGlowLoop();
    },
    pending.length * 150 + 300,
  );
  revealTimeouts.add(timeout);
};

watch(
  [isVisible, motionPaused, () => activeCategory.value?.key],
  ([visible, paused]) => {
    const run = ++animationRun;
    clearRevealTimeouts();
    stopRandomGlowLoop();
    if (paused) revealAllTechnologies();
    else if (visible) playVisibleTitles(run);
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") iconsReady.value = true;
  else if (wrapper.value) {
    iconLoadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        iconsReady.value = true;
        iconLoadObserver.disconnect();
        iconLoadObserver = null;
      },
      { rootMargin: "1000px 0px" },
    );
    iconLoadObserver.observe(wrapper.value);
  }
  registerElement({ id: myId, title: props.data.menu_name });
});

onUnmounted(() => {
  animationRun++;
  iconLoadObserver?.disconnect();
  clearRevealTimeouts();
  stopRandomGlowLoop();
  titleRefs.clear();
  unregisterElement(myId);
});
</script>

<template>
  <ScrollBracketContainer
    :id="myId"
    as="section"
    labelled-by="technologies-heading"
  >
    <div>
      <ScrambleText
        class="mb-15"
        id="technologies-heading"
        tag="h2"
        mode="write"
        :text="data.heading"
      ></ScrambleText>
      <ScrambleText
        class="text-lg text-justify mb-15"
        tag="div"
        mode="write"
        :wrap-words="true"
        :stagger="1"
        :scramble-time="150"
        :text="data.text"
      ></ScrambleText>
      <div ref="wrapper">
        <TechnologyCategoryTabs
          :categories="categories"
          :model-value="activeCategory?.key || ''"
          :lang="lang"
          @update:model-value="selectedCategory = $event"
        />
        <div
          id="technology-items"
          class="tech-cont"
          role="region"
          :aria-labelledby="
            activeCategory
              ? `technology-category-${activeCategory.key}`
              : undefined
          "
        >
          <div
            v-for="tech in technologies"
            v-show="visibleTechnologies.includes(tech)"
            :key="tech.id"
            class="tech"
          >
            <div
              class="tech__svg"
              :class="{
                [svgAnimationClass]: revealedIds.has(tech.id),
                'is-glowing': glowIds.has(tech.id),
              }"
            >
              <img
                v-if="iconsReady"
                v-svg-inject
                :src="tech.featured_media"
                alt=""
                loading="lazy"
                decoding="async"
              />
            </div>
            <ScrambleText
              :ref="
                (el) =>
                  el ? titleRefs.set(tech.id, el) : titleRefs.delete(tech.id)
              "
              tag="h3"
              mode="write"
              class="tech__title"
              :text="tech.title"
              :scramble-time="300"
              :autoplay="false"
            ></ScrambleText>
          </div>
        </div>
      </div>
    </div>

    <div v-if="dataOther">
      <ScrambleText
        class="mb-15"
        tag="h2"
        mode="write"
        :text="dataOther.heading"
      ></ScrambleText>
      <div v-html="dataOther.text" class="strengths-wysiwyg ul--big"></div>
    </div>
  </ScrollBracketContainer>
</template>

<style scoped lang="scss">
.tech-cont {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 50px;

  @include media-breakpoint-down(xl) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @include media-breakpoint-down(lg) {
    grid-template-columns: minmax(0, 1fr);
    gap: 30px;
  }
}

.tech {
  display: grid;
  grid-template-columns: 75px minmax(0, 1fr);
  width: 100%;
  gap: 20px;
  align-items: center;

  &__title {
    overflow-wrap: anywhere;
    font-size: 30px;
    line-height: 1.4;
  }

  &__svg {
    img {
      display: block;
      width: 100%;
      height: auto;
    }

    :deep(svg) {
      fill: #fff !important;
      width: 100%;
      height: auto;
      opacity: 0;
      transform: scale(0.8);
      transition:
        opacity 0.4s ease,
        transform 0.4s ease,
        fill 0.4s ease;
    }

    :deep(path) {
      fill: #fff !important;
      transition: fill 0.4s ease;
    }

    &.is-animating :deep(svg) {
      opacity: 1;
      transform: scale(1);
    }

    &.is-glowing :deep(svg),
    &.is-glowing :deep(path) {
      fill: var(--main-color) !important;
    }
  }

  &:hover &__svg :deep(svg),
  &:hover &__svg :deep(path) {
    fill: var(--main-color) !important;
  }

  @include media-breakpoint-down(lg) {
    grid-template-columns: 40px minmax(0, 1fr);
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
  :deep(ul) {
    @include media-breakpoint-up(lg) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
}
</style>
