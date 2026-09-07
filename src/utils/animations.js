import { gsap } from "gsap";
import { watch } from "vue";
import { motionPaused } from "./motionPreference.js";

const activeFadeAnimations = new Map();

const finishFadeAnimations = () => {
  activeFadeAnimations.forEach((element, tween) => {
    tween.kill();
    gsap.set(element, { opacity: 1, x: 0, y: 0 });
  });
  activeFadeAnimations.clear();
};

watch(motionPaused, (isPaused) => {
  if (isPaused) finishFadeAnimations();
});

export const fadeIn = (
  element,
  duration = 1,
  delay = 0,
  fromX = 0,
  fromY = 0,
) => {
  if (motionPaused.value) {
    gsap.set(element, { opacity: 1, x: 0, y: 0 });
    return null;
  }

  let tween;
  tween = gsap.fromTo(
    element,
    {
      opacity: 0,
      x: fromX,
      y: fromY,
    },
    {
      opacity: 1,
      delay: delay,
      x: 0,
      y: 0,
      duration: duration,
      ease: "power2.out",
      overwrite: "auto",
      onComplete: () => activeFadeAnimations.delete(tween),
      onInterrupt: () => activeFadeAnimations.delete(tween),
    },
  );

  activeFadeAnimations.set(tween, element);
  return tween;
};
