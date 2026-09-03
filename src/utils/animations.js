import { gsap } from "gsap";

export const fadeIn = (
  element,
  duration = 1,
  delay = 0,
  fromX = 0,
  fromY = 0,
) => {
  gsap.fromTo(
    element,
    {
      autoAlpha: 0,
      x: fromX,
      y: fromY,
    },
    {
      autoAlpha: 1,
      delay: delay,
      x: 0,
      y: 0,
      duration: duration,
      ease: "power2.out",
      overwrite: "auto",
    },
  );
};
