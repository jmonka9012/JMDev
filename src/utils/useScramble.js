import { nextTick } from 'vue';
import { gsap } from "gsap";
import {ASCII_STRING_NO_JP} from "../utils/asciiConstants.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const runScrambleLoop = (state, element) => {
    if (!state.isActive || !element) return;

    element.textContent = ASCII_STRING_NO_JP[Math.floor(Math.random() * ASCII_STRING_NO_JP.length)];

    requestAnimationFrame(() => runScrambleLoop(state, element));
}

export function useScramble() {
    let timeouts = [];

    const clearTimeouts = () => {
        timeouts.forEach(clearTimeout);
        timeouts = [];
    };

    const launchWriteAnimation = async (lettersRef, config) => {
        await nextTick();
        clearTimeouts();

        const { scrambleTime = 800, stagger = 40 } = config;

        for (let i = 0; i < lettersRef.value.length; i++) {
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

        const { flash = { from: 320, to: 500 } } = config;

        for (let i = 0; i < lettersRef.value.length; i++) {
            const item = lettersRef.value[i];

            item.state.isActive = true;
            item.visible = true;

            const scrambleTime = Math.random() * (flash.to - flash.from) + flash.from;
            const flashDuration = Math.random() * (flash.to - flash.from) + flash.from;

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
        clearTimeouts
    };
}