import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { watch } from "vue";
import { motionPaused } from "./motionPreference.js";

export const vOnEnter = {
  mounted(el, binding) {
    gsap.set(el, { opacity: motionPaused.value ? 1 : 0 });
    el._motionWatchStop = watch(motionPaused, (isPaused) => {
      if (isPaused) {
        gsap.killTweensOf(el);
        gsap.set(el, { opacity: 1, x: 0, y: 0 });
      }
    });

    el._st = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        if (typeof binding.value === "function") {
          binding.value(el);
        }
      },
    });
  },
  unmounted(el) {
    el._motionWatchStop?.();
    delete el._motionWatchStop;

    if (el._st) {
      el._st.kill();
      delete el._st;
    }
  },
};
