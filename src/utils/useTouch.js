import { onUnmounted, ref } from "vue";

export function useTouch() {
  const x = ref(-30000);
  const y = ref(-30000);

  const update = (e) => {
    if (e.touches && e.touches.length > 0) {
      // Use pageX/Y: the viewport position plus the current page scroll.
      x.value = e.touches[0].pageX;
      y.value = e.touches[0].pageY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      x.value = e.changedTouches[0].pageX;
      y.value = e.changedTouches[0].pageY;
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("touchstart", update, { passive: true });
    window.addEventListener("touchmove", update, { passive: true });
    window.addEventListener("touchend", update, { passive: true });
  }

  onUnmounted(() => {
    window.removeEventListener("touchstart", update);
    window.removeEventListener("touchmove", update);
    window.removeEventListener("touchend", update);
  });

  return { x, y };
}
