<script setup>
import BevelBox from "./BevelBox.vue";
import { gsap } from "gsap";
import {
  ref,
  onMounted,
  onUnmounted,
  inject,
  computed,
  nextTick,
  watch,
} from "vue";

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
const boxDims = ref({ height: 0, width: 0, cornerDist: 0 });
let rect = null;
const activeSides = computed(() => props.corner.split(" "));

const handleEmit = (payload) => {
  rect = payload;
  updateDimensions();
  updateDistance(true); // Pass true to update immediately.
};

const updateDimensions = () => {
  if (!bevelBox.value || !rect) return;
  boxDims.value.height = bevelBox.value.$el?.offsetHeight || 0;
  boxDims.value.width = bevelBox.value.$el?.offsetWidth || 0;
};

let ticking = false;

const updateDistance = (isInstant = false) => {
  if (rect) {
    const isScrollOverride = typeof props.scrollRatio === "number";

    if (!isScrollOverride && mousePos) {
      boxDims.value.cornerDist = Math.hypot(
        mousePos.x.value - rect[activeSides.value[0]],
        mousePos.y.value - rect[activeSides.value[1]],
      );
    }

    let insetValues = [0, 0, 0, 0];

    allSides.forEach((sideString, i) => {
      if (activeSides.value.includes(sideString)) {
        let ratio;

        if (isScrollOverride) {
          ratio = props.scrollRatio;
        } else {
          if (i % 2 !== 0) {
            ratio =
              (boxDims.value.cornerDist /
                (boxDims.value.width + boxDims.value.height)) *
              100;
          } else {
            ratio =
              (boxDims.value.cornerDist /
                (boxDims.value.height + boxDims.value.width)) *
              100;
          }
        }

        ratio = Math.max(0, Math.min(100, ratio));
        const oppositeIndex = (i + 2) % 4;
        insetValues[oppositeIndex] = ratio;
      }
    });

    let insetString = `inset(${insetValues[0]}% ${insetValues[1]}% ${insetValues[2]}% ${insetValues[3]}%)`;

    gsap.to(bevelBox.value.$el, {
      clipPath: insetString,
      duration: isInstant === true ? 0 : isScrollOverride ? 0.5 : 2,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
  ticking = false;
};

if (mousePos) {
  watch([() => mousePos.x.value, () => mousePos.y.value], () => {
    if (
      !ticking &&
      bevelBox.value?.isVisible &&
      typeof props.scrollRatio !== "number"
    ) {
      window.requestAnimationFrame(() => updateDistance(false));
      ticking = true;
    }
  });
}

watch(
  () => props.scrollRatio,
  () => {
    if (!ticking && bevelBox.value?.isVisible) {
      window.requestAnimationFrame(() => updateDistance(false));
      ticking = true;
    }
  },
);

watch(
  () => bevelBox.value?.isVisible,
  (newVisible) => {
    if (newVisible) {
      window.requestAnimationFrame(() => updateDistance(true));
    }
  },
);

onMounted(async () => {
  window.addEventListener("resize", updateDimensions);
  await nextTick();
  updateDimensions();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateDimensions);
});
</script>

<template>
  <BevelBox
    ref="bevelBox"
    class="bevel-box"
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

  // GPU acceleration for mask rendering reduces layout and paint work.
  will-change: clip-path;
}
</style>
