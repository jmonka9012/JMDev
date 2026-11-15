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
  layout: { type: String, default: "panorama" },
  eager: Boolean,
});
const slider = ref(null);
const active = ref(0);
const sizingIndex = ref(0);
const galleryElement = ref(null);
const imageDimensions = ref({});
const chromeHeight = ref(24);
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
let resizeObserver;
const measureChrome = () => {
  const root = galleryElement.value;
  const stage = root?.querySelector(".project-gallery__stage");
  if (!stage) return;
  const style = getComputedStyle(stage);
  const rootStyle = getComputedStyle(root);
  chromeHeight.value = Math.ceil(
    parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(rootStyle.borderTopWidth) +
      parseFloat(rootStyle.borderBottomWidth) +
      (root.querySelector(".project-gallery__footer")?.offsetHeight || 0) +
      (root.querySelector(".swiper-slide-active figcaption")?.offsetHeight ||
        0),
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
    if (url)
      imageDimensions.value[url] = {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
  }
  if (!slider.value?.animating) slider.value?.updateAutoHeight(0);
};
const finishSlideChange = async (swiper) => {
  sizingIndex.value = swiper.activeIndex;
  await nextTick();
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
    class="project-gallery project-gallery--nav-A"
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
          <figure>
            <ProjectImage
              :image="slide.image"
              :manifest="manifest"
              :eager="eager && index === 0"
            />
            <figcaption v-if="slide.caption">{{ slide.caption }}</figcaption>
          </figure>
        </SwiperSlide>
      </Swiper>
    </div>
    <div v-if="slides.length > 1" class="project-gallery__footer">
      <span class="project-micro" role="status" aria-live="polite"
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
          type="button"
          :disabled="active === 0"
          :aria-label="copy.previous"
          @click="slider?.slidePrev()"
        >
          ←
        </button>
        <button
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
