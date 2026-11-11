import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

function mountFrame(scrollRatio) {
  const source = fs
    .readFileSync(
      new URL("../src/components/Partials/CursorBevelBox.vue", import.meta.url),
      "utf8",
    )
    .match(/<script setup>([\s\S]*?)<\/script>/)[1]
    .replace(/^import[\s\S]*?;\n/gm, "");
  const props = { corner: "left top", scrollRatio };
  const calls = { paused: 0, targets: [] };
  const context = {
    defineProps: () => props,
    ref: (value) => ({ value }),
    computed: (fn) => ({
      get value() {
        return fn();
      },
    }),
    inject: () => ({ x: { value: 300 }, y: { value: 200 } }),
    watch() {},
    onMounted() {},
    onUnmounted() {},
    motionPaused: { value: false },
    gsap: {
      quickTo() {
        const tween = (target) => calls.targets.push(target);
        tween.tween = {
          pause() {
            calls.paused++;
          },
          kill() {},
        };
        return tween;
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(
    source +
      "\nbevelBox.value = { $el: {style: {}}, isVisible: true }; globalThis.frame = {handleEmit, updateDistance};",
    context,
  );
  return { props, calls, frame: context.frame, context };
}

test("scroll geometry does not interrupt the clipping tween across container sizes", () => {
  for (const [width, height] of [
    [320, 240],
    [900, 600],
    [1400, 1800],
  ]) {
    const { props, calls, frame } = mountFrame(20);
    frame.handleEmit({ width, height, left: 0, top: 400 });
    props.scrollRatio = 60;
    frame.updateDistance(false);
    for (let top = 400; top >= -height; top -= 20) {
      frame.handleEmit({ width, height, left: 0, top });
    }
    assert.deepEqual(calls.targets, [60]);
    assert.equal(calls.paused, 0, `geometry snapped ${width}x${height}`);
  }
});

test("reduced motion can still apply the new clipping value immediately", () => {
  const { props, calls, frame, context } = mountFrame(20);
  frame.handleEmit({ width: 900, height: 600, left: 0, top: 400 });
  context.motionPaused.value = true;
  props.scrollRatio = 50;
  frame.updateDistance(false);
  assert.equal(calls.paused, 1);
  assert.deepEqual(calls.targets, []);
});

test("pointer-driven frame continues to recalculate after geometry changes", () => {
  const { calls, frame } = mountFrame(null);
  frame.handleEmit({ width: 900, height: 600, left: 0, top: 400 });
  frame.handleEmit({ width: 900, height: 600, left: 0, top: 200 });
  assert.equal(calls.paused, 1);
});
