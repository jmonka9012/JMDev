<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { A11y, Keyboard } from "swiper/modules";
import "swiper/css";

import ProjectImage from "../Partials/ProjectImage.vue";

import { motionPaused } from "../../utils/motionPreference.js";

const props = defineProps({
  slides: Array,
  manifest: Object,
  copy: Object,
  layout: {
    type: String,
    default: "panorama",
  },
  eager: Boolean,
});

const slider = ref(null);
const active = ref(0);
const sizingIndex = ref(0);
const galleryElement = ref(null);
const imageDimensions = ref({});
const chromeHeight = ref(24);
let resizeObserver;

const activeRatio = computed(() => {
  const image = props.slides[sizingIndex.value]?.image;
  const dimensions =
    imageDimensions.value[image?.url] || props.manifest?.[image?.url] || {};
  const width = image?.width || dimensions.width;
  const height = image?.height || dimensions.height;
  return width && height ? width / height : null;
});

const resourceStyle = computed(() =>
  props.layout === "resource" && activeRatio.value
    ? {
        "--project-resource-ratio": activeRatio.value,
        "--project-resource-chrome": `${chromeHeight.value}px`,
      }
    : {},
);

const measureChrome = () => {
  const root = galleryElement.value;
  const stage = root?.querySelector(".project-gallery__stage");
  if (!stage) return;

  const style = getComputedStyle(stage);
  const rootStyle = getComputedStyle(root);
  const stagePadding =
    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const borderHeight =
    parseFloat(rootStyle.borderTopWidth) +
    parseFloat(rootStyle.borderBottomWidth);
  const footerHeight =
    root.querySelector(".project-gallery__footer")?.offsetHeight || 0;
  const captionHeight =
    root.querySelector(".swiper-slide-active figcaption")?.offsetHeight || 0;

  chromeHeight.value = Math.ceil(
    stagePadding + borderHeight + footerHeight + captionHeight,
  );
};

const updateHeight = (event) => {
  const img = event?.target;
  if (
    props.layout === "resource" &&
    img?.tagName === "IMG" &&
    img.naturalWidth &&
    img.naturalHeight
  ) {
    const url = props.slides.find(
      (slide) => slide.image.url === img.getAttribute("src"),
    )?.image.url;
    if (url) {
      imageDimensions.value[url] = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    }
  }
  if (!slider.value?.animating) slider.value?.updateAutoHeight(0);
};

const finishSlideChange = async (swiper) => {
  sizingIndex.value = swiper.activeIndex;

  await nextTick();
  if (swiper.destroyed || !galleryElement.value) return;
  measureChrome();
  swiper.updateAutoHeight(motionPaused.value ? 0 : 320);
};

onMounted(() => {
  if (props.layout !== "resource" || !galleryElement.value) return;
  measureChrome();
  resizeObserver = new ResizeObserver(measureChrome);
  resizeObserver.observe(galleryElement.value);
});

onUnmounted(() => resizeObserver?.disconnect());
</script>

<template>
  <div
    v-if="slides.length"
    ref="galleryElement"
    class="project-gallery"
    :style="resourceStyle"
    @load.capture="updateHeight"
    :class="[
      `project-gallery--${layout}`,
      { 'project-gallery--single': slides.length === 1 },
    ]"
  >
    <div class="project-gallery__stage">
      <Swiper
        :modules="[A11y, Keyboard]"
        :keyboard="{ enabled: true, onlyInViewport: true }"
        :a11y="{
          containerMessage: copy.gallery,
          slideLabelMessage: copy.slide,
        }"
        :speed="motionPaused ? 0 : 320"
        :space-between="20"
        :auto-height="true"
        @swiper="slider = $event"
        @slide-change="active = $event.activeIndex"
        @slide-change-transition-end="finishSlideChange"
      >
        <SwiperSlide v-for="(slide, index) in slides" :key="index">
          <figure class="project-gallery__figure">
            <ProjectImage
              :image="slide.image"
              :manifest="manifest"
              :eager="eager && index === 0"
            />
            <figcaption v-if="slide.caption" class="project-gallery__caption">
              {{ slide.caption }}
            </figcaption>
          </figure>
        </SwiperSlide>
      </Swiper>
    </div>

    <div v-if="slides.length > 1" class="project-gallery__footer">
      <span
        class="project-gallery__counter project-micro"
        role="status"
        aria-live="polite"
        >{{ String(active + 1).padStart(2, "0") }}
        <span class="project-muted"
          >/ {{ String(slides.length).padStart(2, "0") }}</span
        ></span
      >
      <span class="project-gallery__label project-micro">{{
        copy.gallery
      }}</span>
      <div v-if="slides.length > 1" class="project-gallery__arrows">
        <button
          class="project-gallery__button"
          type="button"
          :disabled="active === 0"
          :aria-label="copy.previous"
          @click="slider?.slidePrev()"
        >
          ←
        </button>
        <button
          class="project-gallery__button"
          type="button"
          :disabled="active === slides.length - 1"
          :aria-label="copy.next"
          @click="slider?.slideNext()"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.project-gallery {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  position: relative;
  min-width: 0;
  background: #000;

  &::before,
  &::after {
    content: "";
    position: absolute;
    pointer-events: none;
  }

  &::before {
    top: -5px;
    left: -5px;
    width: 42%;
    height: 64px;
    border-top: 3px solid var(--main-color);
    border-left: 3px solid var(--main-color);
  }

  &::after {
    right: -8px;
    bottom: -8px;
    width: 48px;
    height: 48px;
    border-right: 3px solid #f6fff4;
    border-bottom: 3px solid #f6fff4;
  }

  :deep(.swiper) {
    min-width: 0;
  }

  &__stage {
    grid-column: 1;
    grid-row: 1;
    padding: 12px 12px 0;

    :deep(picture) {
      display: block;
      height: auto;
    }
    :deep(img) {
      display: block;
      width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  &__figure {
    margin: 0;
  }

  &__caption {
    padding: 14px 0 0;
    font-size: 20px;
    color: #d5dfd2;
  }

  &__footer {
    grid-column: 1 / -1;
    grid-row: 2;
    display: flex;
    align-items: center;
    gap: 20px;
    min-height: 64px;
    padding: 12px 20px;
  }

  &__counter {
    color: var(--main-color);
    white-space: nowrap;
  }
  &__label {
    margin-right: auto;
    color: #a8b0a6;
  }
  &__arrows {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  &__button {
    width: 48px;
    height: 40px;
    border: 1px solid #ffffff60;
    font: 28px "Determination";
    color: white;
    background: #000;
    transition:
      background 0.2s,
      color 0.2s;

    &:enabled:hover {
      border-color: var(--main-color);
      color: #000;
      background: var(--main-color);
    }
    &:disabled {
      opacity: 0.3;
    }
  }

  &--single .project-gallery__stage {
    padding-bottom: 12px;
  }

  &--resource {
    width: min(
      100%,
      calc(
        (650px - var(--project-resource-chrome, 24px)) *
          var(--project-resource-ratio, 100)
      )
    );
    margin-left: auto;
    border: 1px solid #ffffff28;
    box-shadow:
      5px 5px 0 #000,
      6px 6px 0 #ffffff35;
    transition: width 320ms ease;

    &::before,
    &::after {
      content: none;
    }

    .project-gallery__stage :deep(img) {
      width: auto;
      max-width: 100%;
      max-height: calc(650px - var(--project-resource-chrome, 24px));
      margin-left: auto;
    }
  }

  @media (max-width: 767px) {
    &__footer {
      gap: 8px;
      padding: 12px;
    }
    &__label {
      display: none;
    }
    &--single .project-gallery__stage {
      padding-inline: 8px;
    }
  }
}
</style>
