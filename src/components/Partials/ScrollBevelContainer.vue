<script setup>
import CursorBevelBox from "./CursorBevelBox.vue";
import { ref, onMounted, onUnmounted } from "vue";

const scrollContainer = ref(null);
const scrollRatio = ref(0);
let ticking = false;

const props = defineProps({
  blur: {
    type: Boolean,
    required: false,
    default: true,
  },
  tracked: {
    type: Boolean,
    required: false,
    default: false,
  },
});

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

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  updateRatio();
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
});
</script>

<template>
  <div
    ref="scrollContainer"
    :data-ascii-tracked="tracked ? 'filled-box' : undefined"
    class="container scroll-bevel"
    :class="{ 'bg-blur': blur }"
  >
    <CursorBevelBox :scroll-ratio="scrollRatio"></CursorBevelBox>
    <CursorBevelBox
      corner="right bottom"
      :scroll-ratio="scrollRatio"
    ></CursorBevelBox>
    <slot></slot>
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
</style>
