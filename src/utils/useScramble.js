import { nextTick } from "vue";
import { gsap } from "gsap";
import { ASCII_STRING_NO_JP } from "../utils/asciiConstants.js";
import { motionPaused } from "./motionPreference.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const activeScrambles = new Map();
let scrambleFrame = null;

const renderScrambleCharacter = (element) => {
  element.textContent =
    ASCII_STRING_NO_JP[Math.floor(Math.random() * ASCII_STRING_NO_JP.length)];
};

const scheduleScrambleFrame = () => {
  if (scrambleFrame !== null || activeScrambles.size === 0) return;

  scrambleFrame = requestAnimationFrame(() => {
    scrambleFrame = null;

    activeScrambles.forEach((element, state) => {
      if (!state.isActive || !element?.isConnected || motionPaused.value) {
        activeScrambles.delete(state);
        return;
      }

      renderScrambleCharacter(element);
    });

    scheduleScrambleFrame();
  });
};

export const runScrambleLoop = (state, element) => {
  if (!state.isActive || !element || motionPaused.value) return;

  activeScrambles.set(state, element);
  renderScrambleCharacter(element);
  scheduleScrambleFrame();
};

export function useScramble() {
  let timeouts = [];

  const clearTimeouts = () => {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  };

  const launchWriteAnimation = async (lettersRef, config) => {
    await nextTick();
    clearTimeouts();

    const { scrambleTime = 800, stagger = 40, shouldStop } = config;

    for (let i = 0; i < lettersRef.value.length; i++) {
      if (motionPaused.value || shouldStop?.()) break;
      const item = lettersRef.value[i];

      item.state.isActive = true;
      item.visible = true;

      runScrambleLoop(item.state, item.el);

      const timer = setTimeout(() => {
        item.state.isActive = false;
        if (item.el) item.el.innerText = item.state.originalChar;
      }, scrambleTime);

      timeouts.push(timer);

      if (stagger > 0) await sleep(stagger);
    }
  };

  const launchFlashAnimation = async (lettersRef, config) => {
    await nextTick();
    clearTimeouts();

    const { flash = { from: 320, to: 500 }, shouldStop } = config;

    for (let i = 0; i < lettersRef.value.length; i++) {
      if (motionPaused.value || shouldStop?.()) break;
      const item = lettersRef.value[i];

      item.state.isActive = true;
      item.visible = true;

      const scrambleTime = Math.random() * (flash.to - flash.from) + flash.from;
      const flashDuration =
        Math.random() * (flash.to - flash.from) + flash.from;

      if (item.el) {
        const setter = gsap.quickSetter(item.el, "animation-duration");
        setter(`${flashDuration}ms`);
      }

      runScrambleLoop(item.state, item.el);

      const timer = setTimeout(() => {
        item.state.isActive = false;
        if (item.el) item.el.innerText = item.state.originalChar;
      }, scrambleTime);

      timeouts.push(timer);
    }
  };

  return {
    launchWriteAnimation,
    launchFlashAnimation,
    clearTimeouts,
  };
}
