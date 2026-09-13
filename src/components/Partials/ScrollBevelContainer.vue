<script setup>
import CursorBevelBox from "./CursorBevelBox.vue";
import { ref, onMounted, onUnmounted } from "vue";
import {
  subscribeBevelResize,
  subscribeBevelScroll,
} from "../../utils/bevelFrameScheduler.js";

const props = defineProps({
  as: {
    type: String,
    default: "div",
  },
  labelledBy: {
    type: String,
    required: false,
  },
  blur: {
    type: Boolean,
    default: true,
  },
  tracked: {
    type: Boolean,
    default: false,
  },
});

const scrollContainer = ref(null);
const scrollRatio = ref(0);
const isMobile = ref(false);
const isReady = ref(false);

let isTrackingScroll = false;
let isInViewport = false;
let mobileMediaQuery;
let visibilityObserver;
let stopScrollSubscription = () => {};
let stopResizeSubscription = () => {};

const startVisibilityTracking = () => {
  if (visibilityObserver || !scrollContainer.value) return;

  visibilityObserver = new IntersectionObserver(([entry]) => {
    isInViewport = entry.isIntersecting;
    if (isInViewport) updateRatio();
  });
  visibilityObserver.observe(scrollContainer.value);
};

const stopVisibilityTracking = () => {
  visibilityObserver?.disconnect();
  visibilityObserver = null;
  isInViewport = false;
};

const updateRatio = () => {
  if (!scrollContainer.value) {
    return;
  }

  const rect = scrollContainer.value.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const viewportCenter = windowHeight / 2;
  const containerCenter = rect.top + rect.height / 2;
  const distance = Math.abs(viewportCenter - containerCenter);

  scrollRatio.value = (distance / windowHeight) * 1.5 * 100;
};

const onScroll = () => {
  if (isInViewport) updateRatio();
};

const startScrollTracking = () => {
  if (isTrackingScroll) return;
  stopScrollSubscription = subscribeBevelScroll(onScroll);
  stopResizeSubscription = subscribeBevelResize(onScroll);
  isTrackingScroll = true;
  updateRatio();
};

const stopScrollTracking = () => {
  if (!isTrackingScroll) return;
  stopScrollSubscription();
  stopResizeSubscription();
  stopScrollSubscription = () => {};
  stopResizeSubscription = () => {};
  isTrackingScroll = false;
};

const handleViewportChange = (e) => {
  isMobile.value = e.matches;

  if (e.matches) {
    stopScrollTracking();
    stopVisibilityTracking();
  } else {
    startVisibilityTracking();
    startScrollTracking();
  }
};

onMounted(() => {
  mobileMediaQuery = window.matchMedia("(max-width: 991.98px)");
  handleViewportChange(mobileMediaQuery);

  if (mobileMediaQuery.addEventListener) {
    mobileMediaQuery.addEventListener("change", handleViewportChange);
  } else {
    mobileMediaQuery.addListener(handleViewportChange);
  }

  isReady.value = true;
});

onUnmounted(() => {
  stopScrollTracking();
  stopVisibilityTracking();
  if (mobileMediaQuery?.removeEventListener) {
    mobileMediaQuery.removeEventListener("change", handleViewportChange);
  } else if (mobileMediaQuery?.removeListener) {
    mobileMediaQuery.removeListener(handleViewportChange);
  }
});
</script>

<template>
  <component
    :is="as"
    ref="scrollContainer"
    :aria-labelledby="labelledBy"
    :data-ascii-tracked="tracked ? 'filled-box' : undefined"
    class="container scroll-bevel"
    :class="{ 'bg-blur': blur }"
  >
    <template v-if="isReady">
      <template v-if="isMobile">
        <div class="scroll-bevel__static-frame" aria-hidden="true"></div>
      </template>

      <template v-else>
        <CursorBevelBox :scroll-ratio="scrollRatio" />
        <CursorBevelBox corner="right bottom" :scroll-ratio="scrollRatio" />
      </template>
    </template>

    <div class="scroll-bevel__content">
      <slot></slot>
    </div>
  </component>
</template>

<style scoped lang="scss">
.container.scroll-bevel {
  position: relative;
  padding: 40px 40px 80px;
  margin-bottom: 120px;

  @include media-breakpoint-down(lg) {
    padding: 30px 26px 50px;
    margin-bottom: 80px;
    max-width: 100dvw;
  }
}

.scroll-bevel {
  &__static-frame {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    border: 5px solid var(--main-color);
  }

  &__content {
    position: relative;
    z-index: 10;
  }
}
</style>
