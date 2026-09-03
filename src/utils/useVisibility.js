import { ref, onMounted, onUnmounted } from "vue";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function useVisibility(targetRef) {
  const isVisible = ref(false);
  let st = null;

  onMounted(() => {
    if (!targetRef.value) return;

    st = ScrollTrigger.create({
      trigger: targetRef.value,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (isVisible.value = self.isActive),
    });
  });

  onUnmounted(() => {
    if (st) st.kill();
  });

  return isVisible;
}
