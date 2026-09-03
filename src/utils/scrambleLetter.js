export const runScrambleLoop = (state, element) => {
    if (!state.isActive || !element) return;

    element.textContent = asciiStringNoJp[Math.floor(Math.random() * asciiStringNoJp.length)];

    requestAnimationFrame(() => runScrambleLoop(state, element));
}

