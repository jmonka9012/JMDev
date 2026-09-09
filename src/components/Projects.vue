<script setup>
import { nextTick, ref, watch, onMounted, onUnmounted } from "vue";
import { useElementsRegistry } from "../utils/useRegistry.js";
const { registerElement, unregisterElement } = useElementsRegistry();
import { Swiper, SwiperSlide } from "swiper/vue";
import {
  Pagination,
  Navigation,
  EffectCube,
  EffectFade,
  Autoplay,
  Virtual,
  A11y,
  Keyboard,
} from "swiper/modules";
import { useVisibility } from "../utils/useVisibility.js";
import { refreshState } from "../utils/refreshState.js";
import { motionPaused } from "../utils/motionPreference.js";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import "swiper/css/effect-cube";
import "swiper/css/effect-fade";

import ScrambleText from "./Partials/ScrambleText.vue";
import ScrollBevelContainer from "./Partials/ScrollBevelContainer.vue";
import CustomButton from "./Partials/CustomButton.vue";

const myId = "projects";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  lang: {
    type: String,
    required: false,
  },
  projects: {
    type: Array,
    required: true,
  },
});

const scrambleRefs = ref([]);
const activeIndex = ref(0);

const sliderContainer = ref(null);
const isSliderVisible = useVisibility(sliderContainer);
const innerSwipers = new Set();
const pausedInnerSwipers = new Set();

const innerAutoplay = {
  delay: 300,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
};

const copy =
  props.lang === "pl"
    ? {
        carousel: "Karuzela projektów",
        carouselDescription: "karuzela",
        previous: "Poprzedni projekt",
        next: "Następny projekt",
        first: "To jest pierwszy projekt",
        last: "To jest ostatni projekt",
        pagination: "Przejdź do projektu {{index}}",
        slide: "Projekt {{index}} z {{slidesLength}}",
      }
    : {
        carousel: "Projects carousel",
        carouselDescription: "carousel",
        previous: "Previous project",
        next: "Next project",
        first: "This is the first project",
        last: "This is the last project",
        pagination: "Go to project {{index}}",
        slide: "Project {{index}} of {{slidesLength}}",
      };

const onInnerSwiperInit = (swiper) => {
  innerSwipers.add(swiper);

  if (motionPaused.value) {
    pausedInnerSwipers.add(swiper);
    swiper.autoplay?.stop();
  }
};

watch(motionPaused, (isPaused) => {
  if (isPaused) {
    innerSwipers.forEach((swiper) => {
      if (swiper.destroyed || !swiper.autoplay?.running) return;

      pausedInnerSwipers.add(swiper);
      swiper.autoplay.stop();
    });
    return;
  }

  pausedInnerSwipers.forEach((swiper) => {
    if (!swiper.destroyed) swiper.autoplay?.start();
  });
  pausedInnerSwipers.clear();
});

const focusableSelector =
  "a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]";

const updateSlideFocusability = (swiper) => {
  swiper.slides.forEach((slide) => {
    const isActive = slide.classList.contains("swiper-slide-active");

    slide.querySelectorAll(focusableSelector).forEach((element) => {
      if (!isActive) {
        if (!element.hasAttribute("data-projects-original-tabindex")) {
          element.setAttribute(
            "data-projects-original-tabindex",
            element.getAttribute("tabindex") ?? "",
          );
        }
        element.setAttribute("tabindex", "-1");
        return;
      }

      if (!element.hasAttribute("data-projects-original-tabindex")) return;

      const originalTabindex = element.getAttribute(
        "data-projects-original-tabindex",
      );
      if (originalTabindex) element.setAttribute("tabindex", originalTabindex);
      else element.removeAttribute("tabindex");
      element.removeAttribute("data-projects-original-tabindex");
    });
  });
};

const tryPlayAnimation = () => {
  if (scrambleRefs.value[activeIndex.value]) {
    scrambleRefs.value[activeIndex.value].play();
  }
};

const onSwiperInit = (swiper) => {
  activeIndex.value = swiper.realIndex;
  nextTick(() => updateSlideFocusability(swiper));
  setTimeout(() => {
    tryPlayAnimation();
  }, 100);
};

const onSlideChange = (swiper) => {
  activeIndex.value = swiper.realIndex;
  nextTick(() => updateSlideFocusability(swiper));
  tryPlayAnimation();
};

onMounted(() => {
  registerElement({
    id: myId,
    title: props.data.menu_name,
  });
});

onUnmounted(() => {
  unregisterElement(myId);
  innerSwipers.clear();
  pausedInnerSwipers.clear();
});

const buttonText = props.lang === "pl" ? "zobacz" : "view";

const normalizeProjectContent = (content) =>
  content
    .replace(/<h[1-3](\b[^>]*)>/gi, "<h4$1>")
    .replace(/<\/h[1-3]>/gi, "<\/h4>");
</script>

<template>
  <section
    ref="sliderContainer"
    class="w-full relative"
    :id="myId"
    aria-labelledby="projects-heading"
  >
    <div class="container px-[40px] mx-auto lg:px-[26px]">
      <ScrambleText
        id="projects-heading"
        class="mb-6"
        mode="write"
        tag="h2"
        :text="data.heading"
      />
    </div>

    <div class="container p-0 relative">
      <swiper
        :effect="'fade'"
        :fadeEffect="{ crossFade: true }"
        :modules="[Pagination, Navigation, Virtual, EffectFade, A11y, Keyboard]"
        :navigation="{
          nextEl: '.custom-swiper-next',
          prevEl: '.custom-swiper-prev',
        }"
        :pagination="{
          el: '.custom-swiper-pagination',
          clickable: true,
        }"
        :a11y="{
          containerRole: 'region',
          containerMessage: copy.carousel,
          containerRoleDescriptionMessage: copy.carouselDescription,
          prevSlideMessage: copy.previous,
          nextSlideMessage: copy.next,
          firstSlideMessage: copy.first,
          lastSlideMessage: copy.last,
          paginationBulletMessage: copy.pagination,
          slideLabelMessage: copy.slide,
        }"
        :keyboard="{
          enabled: true,
          onlyInViewport: true,
          pageUpDown: false,
        }"
        :simulate-touch="false"
        :slides-per-group="1"
        :slides-per-view="1"
        :space-between="130"
        :speed="1200"
        class="projects-swiper"
        virtual
        @slideChange="onSlideChange"
        @swiper="onSwiperInit"
        @after-init="refreshState"
      >
        <swiper-slide
          v-for="(post, index) in projects"
          :key="post.id"
          class="slide-wrapper projects-swiper__slide"
        >
          <article class="h-full w-full relative bg-blur">
            <div class="container project-container mb-0">
              <ScrambleText
                :ref="
                  (el) => {
                    if (el) scrambleRefs[index] = el;
                  }
                "
                :autoplay="false"
                :once="false"
                :text="post.title"
                :scramble-time="400"
                class="mb-12 text-center h2"
                mode="write"
                tag="h3"
              />
              <div class="project">
                <div class="project__left">
                  <div
                    class="post-content mb-10"
                    v-html="normalizeProjectContent(post.content)"
                  ></div>
                  <CustomButton
                    v-if="post.acf.link"
                    :link="post.acf.link"
                    :text="buttonText"
                  ></CustomButton>
                </div>
                <div class="project__right">
                  <swiper
                    :allow-touch-move="false"
                    :autoplay="innerAutoplay"
                    :loop="true"
                    :modules="[EffectCube, Autoplay]"
                    :nested="true"
                    :speed="2000"
                    class="inner-swiper h-full"
                    effect="cube"
                    @swiper="onInnerSwiperInit"
                    @after-init="refreshState"
                  >
                    <swiper-slide class="h-full">
                      <div class="h-full project__gallery">
                        <img :src="post.acf.photo_1" alt="" />
                      </div>
                    </swiper-slide>
                    <swiper-slide class="h-full">
                      <div class="h-full project__gallery">
                        <img :src="post.acf.photo_2" alt="" />
                      </div>
                    </swiper-slide>
                    <swiper-slide class="h-full">
                      <div class="h-full project__gallery">
                        <img :src="post.acf.photo_3" alt="" />
                      </div>
                    </swiper-slide>
                  </swiper>
                </div>
              </div>
            </div>
          </article>
        </swiper-slide>
      </swiper>
      <div
        v-if="projects.length"
        class="projects-swiper__counter"
        aria-atomic="true"
        aria-live="polite"
      >
        {{ activeIndex + 1 }}/{{ projects.length }}
      </div>
    </div>

    <div class="project-navigation">
      <div class="project-navigation__inner">
        <button
          class="custom-swiper-prev project-navigation__prev"
          :aria-label="copy.previous"
        >
          <img v-svg-inject alt="" src="../assets/next-item.svg" />
        </button>
        <div
          class="custom-swiper-pagination project-navigation__pagination flex justify-center gap-2"
        ></div>
        <button
          class="custom-swiper-next project-navigation__next"
          :aria-label="copy.next"
        >
          <img v-svg-inject alt="" src="../assets/next-item.svg" />
        </button>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.project-container.scroll-bevel.container {
}

.project-container {
  border: 5px solid var(--main-color);
  padding-top: 40px;
  padding-bottom: 40px;
}

.project {
  display: grid;
  grid-template-columns: 1fr 35%;
  gap: 120px;

  @include media-breakpoint-down(lg) {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  &__right {
    width: 100%;
    height: 0;
    min-height: 100%;
    overflow-anchor: none;

    @include media-breakpoint-down(lg) {
      height: 340px;
      min-height: auto;
      margin: 0 auto;
      overflow: hidden;
    }
  }

  &__left {
    display: flex;
    flex-direction: column;
    align-items: start;
  }

  &__gallery {
    border-top: 12px solid white;
    border-left: 7px solid white;
    border-right: 12px solid var(--main-color);
    border-bottom: 3px solid var(--main-color);
  }
}

.post-content {
  :deep(p) {
    margin-bottom: 1rem;
  }

  :deep(h2),
  :deep(h3),
  :deep(h4) {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  :deep(h4.wp-block-heading) {
    font-size: 36px;

    @include media-breakpoint-down(lg) {
      font-size: 24px;
    }
  }
}

.projects-swiper {
  width: 100%;
  overflow: visible;

  &__counter {
    display: none;

    @include media-breakpoint-down(lg) {
      display: block;
      position: absolute;
      top: 12px;
      right: 16px;
      z-index: 6;
      color: #fff;
      font-size: 20px;
      line-height: 1;
      pointer-events: none;
    }
  }

  > :deep(.swiper-wrapper) {
    display: flex;

    @media (max-width: 1630px) {
      overflow: hidden;
    }
  }
}

.project-navigation {
  width: 100%;
  pointer-events: none;
  margin-top: 32px;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: fit-content;
    margin: 0 auto;
    z-index: 10;
    pointer-events: all;

    @include media-breakpoint-down(lg) {
      position: sticky;
      top: calc(100% - 130px);
      margin-top: 200px;
      width: 100%;
      justify-content: space-between;
      padding: 0 16px;
    }
  }

  &__pagination {
    @include media-breakpoint-down(lg) {
      display: none;
    }

    width: auto;
    align-items: center;

    :deep(.swiper-pagination-bullet) {
      position: relative;
      width: 12px;
      height: 12px;
      background-color: #fff;
      border-radius: 0;
      opacity: 1;
      cursor: pointer;
      transition: background-color 0.3s;

      &::after {
        content: "";
        position: absolute;
        inset: -4px;
      }
    }

    :deep(.swiper-pagination-bullet-active) {
      background-color: var(--main-color);
    }
  }

  &__prev {
    svg {
      transform: rotate(180deg);
    }
  }

  &__prev,
  &__next {
    transition: all 0.2s ease-in-out;

    svg {
      fill: #fff;
      width: 70px;
      height: auto;
      transition: fill 0.3s ease-in-out;

      @include media-breakpoint-down(lg) {
        fill: var(--main-color);
      }
    }

    &:hover svg {
      fill: var(--main-color);
    }

    @include media-breakpoint-down(lg) {
      &.swiper-button-disabled {
        opacity: 0;
      }
    }
  }

  @include media-breakpoint-down(lg) {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    height: 70%;
  }
}

.inner-swiper {
  position: relative;
  z-index: 5;
  user-select: none;
  //pointer-events: auto;
  touch-action: none;
  overflow-anchor: none;

  @include media-breakpoint-down(lg) {
    margin: 20px auto;
    width: 70dvw;
    height: calc(100% - 40px);
  }

  .swiper-slide {
    height: 100%;

    img {
      height: 100%;
      //height: 300px;
      width: 100%;
      object-fit: cover;
    }
  }
}

:deep(.swiper-slide-visible) {
  pointer-events: all;
}

.cbb {
  position: absolute;
  inset: 0;
  z-index: 1;
}
</style>
