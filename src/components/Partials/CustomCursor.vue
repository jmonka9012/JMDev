<script setup>
import { inject, onMounted, onUnmounted, ref } from "vue";

const cursorDot = ref(null);
const isVisible = ref(false);
const isTouch = inject("isTouch"); // Assumes this is a reactive ref (for example, from useTouch).

onMounted(() => {
  if (!cursorDot.value) return;

  let mouseX = 0;
  let mouseY = 0;
  let ticking = false;

  const renderCursor = () => {
    cursorDot.value.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    ticking = false;
  };

  const moveCursor = (e) => {
    if (isTouch.value) {
      if (isVisible.value) isVisible.value = false;
      return;
    }

    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible.value) {
      isVisible.value = true;
    }

    if (!ticking) {
      window.requestAnimationFrame(renderCursor);
      ticking = true;
    }
  };

  window.addEventListener("mousemove", moveCursor, { capture: true });

  onUnmounted(() => {
    window.removeEventListener("mousemove", moveCursor, { capture: true });
  });
});
</script>

<template>
  <div
    ref="cursorDot"
    class="custom-cursor-dot"
    :class="{ 'is-active': isVisible && !isTouch }"
  ></div>
</template>

<style scoped lang="scss">
.custom-cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 10px;
  height: 10px;
  background-color: var(--main-color);
  border-radius: 50%;
  pointer-events: none !important;
  z-index: 999999 !important;
  will-change: transform;
  mix-blend-mode: difference;

  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-active {
    opacity: 1;
  }
}
</style>
