<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { gsap } from "gsap";
import { motionPaused } from "../../utils/motionPreference.js";
import {
  requestBevelResize,
  subscribeBevelResize,
  subscribeBevelScroll,
} from "../../utils/bevelFrameScheduler.js";

defineProps({
  as: { type: String, default: "div" },
  labelledBy: { type: String, default: undefined },
  tracked: { type: Boolean, default: false },
});

const container = ref(null);
const frames = ref(null);
const clip = { ratio: 0 };
let visible = false;
let visibilityObserver;
let resizeObserver;
let clipTo;
let stopScroll;
let stopResize;

const renderClip = () => {
  frames.value?.style.setProperty("--bracket-clip", `${clip.ratio}%`);
};

const updateRatio = (instant = false) => {
  if (!visible || motionPaused.value || !container.value) return;

  // One measurement per visible container, shared scroll/resize frame.
  // Match the old bevel's distance curve without scaling the content.
  const rect = container.value.getBoundingClientRect();
  const distance = Math.abs(
    window.innerHeight / 2 - (rect.top + rect.height / 2),
  );
  const ratio = Math.min(100, (distance / window.innerHeight) * 150);
  if (instant) {
    clipTo.tween.pause();
    clip.ratio = ratio;
    renderClip();
  } else {
    clipTo(ratio);
  }
};

const stopTracking = () => {
  stopScroll?.();
  stopResize?.();
  stopScroll = undefined;
  stopResize = undefined;
  clipTo?.tween.pause();
};

const syncTracking = () => {
  stopTracking();
  if (!visible || motionPaused.value) return;
  updateRatio(true);
  stopScroll = subscribeBevelScroll(() => updateRatio());
  stopResize = subscribeBevelResize(() => updateRatio());
};

watch(motionPaused, (paused) => {
  syncTracking();
  if (paused) {
    // A stable, full bracket is also the initial SSR/reduced-motion state.
    clip.ratio = 0;
    renderClip();
  }
});

onMounted(() => {
  clipTo = gsap.quickTo(clip, "ratio", {
    duration: 0.5,
    ease: "power2.out",
    onUpdate: renderClip,
  });
  visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncTracking();
  });
  visibilityObserver.observe(container.value);

  // A category change can also move subsequent containers. Notify all visible
  // subscribers through the existing scheduler, coalescing observer callbacks.
  resizeObserver = new ResizeObserver(requestBevelResize);
  resizeObserver.observe(container.value);
});

onUnmounted(() => {
  stopTracking();
  visibilityObserver?.disconnect();
  resizeObserver?.disconnect();
  clipTo?.tween.kill();
});
</script>

<template>
  <component
    :is="as"
    ref="container"
    :aria-labelledby="labelledBy"
    :data-ascii-tracked="tracked ? 'filled-box' : undefined"
    class="container scroll-bracket"
  >
    <div ref="frames" class="scroll-bracket__frames" aria-hidden="true">
      <span class="scroll-bracket__opening"></span>
      <span class="scroll-bracket__closing"></span>
    </div>
    <div class="scroll-bracket__content"><slot></slot></div>
  </component>
</template>

<style scoped lang="scss">
.container.scroll-bracket {
  position: relative;
  padding: 40px 40px 80px;
  margin-bottom: 120px;
  background: #000;

  @include media-breakpoint-down(lg) {
    padding: 30px 26px 50px;
    margin-bottom: 80px;
    max-width: 100dvw;
  }
}

.scroll-bracket {
  // Maximum arm lengths relative to the container.
  --bracket-opening-width: 72%;
  --bracket-opening-height: 62%;
  --bracket-closing-width: 72%;
  --bracket-closing-height: 62%;

  &__frames {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__opening,
  &__closing {
    position: absolute;
    box-sizing: border-box;
    max-width: 100%;
  }

  &__opening {
    top: 0;
    left: 0;
    width: var(--bracket-opening-width);
    height: var(--bracket-opening-height);
    border-top: 4px solid #35ff25;
    border-left: 4px solid #35ff25;
    clip-path: inset(0 var(--bracket-clip, 0%) var(--bracket-clip, 0%) 0);
  }

  &__closing {
    right: 0;
    bottom: 0;
    width: var(--bracket-closing-width);
    height: var(--bracket-closing-height);
    border-bottom: 3px solid #f6fff4;
    border-right: 3px solid #f6fff4;
    clip-path: inset(var(--bracket-clip, 0%) 0 0 var(--bracket-clip, 0%));
  }

  &__content {
    position: relative;
    z-index: 10;
  }
}
</style>
