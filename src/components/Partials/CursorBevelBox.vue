<script setup>
import BevelBox from "./BevelBox.vue";
import { gsap } from "gsap";
import { ref, onMounted, onUnmounted, inject, computed, watch } from "vue";
import { motionPaused } from "../../utils/motionPreference.js";
import { subscribeBevelPointer } from "../../utils/bevelFrameScheduler.js";

const props = defineProps({
  corner: {
    type: String,
    default: "left top",
  },
  bevelStyle: {
    type: String,
    default: "",
  },
  outside: {
    type: Boolean,
    default: false,
  },
  scrollRatio: {
    type: Number,
    default: null,
  },
});

const allSides = ["top", "right", "bottom", "left"];
const mousePos = inject("mousePos");
const bevelBox = ref();
const isBevelVisible = ref(false);
const boxDims = ref({ height: 0, width: 0, cornerDist: 0 });
let rect = null;
let clipQuickTo = null;
let stopPointerSubscription = () => {};
const clipState = { ratio: 0 };
const activeSides = computed(() => props.corner.split(" "));

const handleEmit = (payload) => {
  rect = payload;
  updateDimensions();
  updateDistance(true); // Pass true to update immediately.
};

const updateDimensions = () => {
  if (!bevelBox.value || !rect) return;
  boxDims.value.height = rect.height;
  boxDims.value.width = rect.width;
};

const applyClipRatio = () => {
  if (!bevelBox.value?.$el) return;

  const insetValues = [0, 0, 0, 0];
  allSides.forEach((sideString, index) => {
    if (!activeSides.value.includes(sideString)) return;
    insetValues[(index + 2) % 4] = clipState.ratio;
  });

  bevelBox.value.$el.style.clipPath = `inset(${insetValues[0]}% ${insetValues[1]}% ${insetValues[2]}% ${insetValues[3]}%)`;
};

const setClipRatio = (ratio, isInstant) => {
  if (!clipQuickTo) {
    clipState.ratio = ratio;
    applyClipRatio();
    clipQuickTo = gsap.quickTo(clipState, "ratio", {
      duration: typeof props.scrollRatio === "number" ? 0.5 : 2,
      ease: "power2.out",
      onUpdate: applyClipRatio,
    });
    return;
  }

  if (motionPaused.value || isInstant) {
    clipQuickTo.tween.pause();
    clipState.ratio = ratio;
    applyClipRatio();
    return;
  }

  clipQuickTo(ratio);
};

const updateDistance = (isInstant = false) => {
  if (rect) {
    const isScrollOverride = typeof props.scrollRatio === "number";

    if (!isScrollOverride && mousePos) {
      boxDims.value.cornerDist = Math.hypot(
        mousePos.x.value - rect[activeSides.value[0]],
        mousePos.y.value - rect[activeSides.value[1]],
      );
    }

    const ratio = Math.max(
      0,
      Math.min(
        100,
        isScrollOverride
          ? props.scrollRatio
          : (boxDims.value.cornerDist /
              (boxDims.value.width + boxDims.value.height)) *
              100,
      ),
    );

    setClipRatio(ratio, isInstant);
  }
};

watch(
  () => props.scrollRatio,
  () => {
    if (bevelBox.value?.isVisible) updateDistance(false);
  },
);

watch(
  () => bevelBox.value?.isVisible,
  (newVisible) => {
    isBevelVisible.value = Boolean(newVisible);
    if (newVisible) {
      updateDistance(true);
    }
  },
);

watch(motionPaused, (isPaused) => {
  if (!isPaused || !bevelBox.value?.$el) return;

  updateDistance(true);
});

onMounted(() => {
  stopPointerSubscription = subscribeBevelPointer(mousePos, () => {
    if (bevelBox.value?.isVisible && typeof props.scrollRatio !== "number") {
      updateDistance(false);
    }
  });
  updateDimensions();
});

onUnmounted(() => {
  stopPointerSubscription();
  clipQuickTo?.tween.kill();
});
</script>

<template>
  <BevelBox
    ref="bevelBox"
    class="bevel-box"
    :class="{ 'is-visible': isBevelVisible }"
    :style="props.bevelStyle"
    :cbb-child="true"
    :active-sides="props.corner"
    :max-distance="300"
    @emit-rect="handleEmit"
  >
    <slot></slot>
  </BevelBox>
</template>

<style scoped lang="scss">
.bevel-box {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  &.is-visible {
    // Reserve a compositor layer only while the frame can be animated.
    will-change: clip-path;
  }
}
</style>
