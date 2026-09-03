<script setup>
import CursorBevelBox from "./CursorBevelBox.vue";
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
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

let ticking = false;
let isTrackingScroll = false;
let mobileMediaQuery;

const updateRatio = () => {
  if (!scrollContainer.value) {
    ticking = false;
    return;
  }

  const rect = scrollContainer.value.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const viewportCenter = windowHeight / 2;
  const containerCenter = rect.top + rect.height / 2;
  const distance = Math.abs(viewportCenter - containerCenter);

  scrollRatio.value = (distance / windowHeight) * 1.5 * 100;
  ticking = false;
};

const onScroll = () => {
  if (!ticking) {
    window.requestAnimationFrame(updateRatio);
    ticking = true;
  }
};

const startScrollTracking = () => {
  if (isTrackingScroll) return;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  isTrackingScroll = true;
  updateRatio();
};

const stopScrollTracking = () => {
  if (!isTrackingScroll) return;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  isTrackingScroll = false;
  ticking = false;
};

const handleViewportChange = (e) => {
  isMobile.value = e.matches;

  if (e.matches) {
    stopScrollTracking();
  } else {
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
  if (mobileMediaQuery?.removeEventListener) {
    mobileMediaQuery.removeEventListener("change", handleViewportChange);
  } else if (mobileMediaQuery?.removeListener) {
    mobileMediaQuery.removeListener(handleViewportChange);
  }
});
</script>

<template>
  <div
    ref="scrollContainer"
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
  </div>
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
