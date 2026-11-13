import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// Exercise the partial's lifecycle with browser geometry and scheduler adapters.
function mountBracket() {
  const source = fs
    .readFileSync(
      new URL(
        "../src/components/Partials/ScrollBracketContainer.vue",
        import.meta.url,
      ),
      "utf8",
    )
    .match(/<script setup>([\s\S]*?)<\/script>/)[1]
    .replace(/^import[\s\S]*?;\n/gm, "");
  let mount, unmount, onMotion, onVisibility, onResize;
  const scroll = new Set(),
    resize = new Set();
  const calls = {
    reads: 0,
    targets: [],
    disconnected: 0,
    killed: 0,
    invalidations: 0,
  };
  const rect = { top: 200, height: 600 };
  const styles = {};
  const motionPaused = { value: false };
  const subscribe = (set) => (fn) => {
    set.add(fn);
    return () => set.delete(fn);
  };
  const context = {
    defineProps() {},
    ref: (value) => ({ value }),
    watch: (_, fn) => {
      onMotion = fn;
    },
    onMounted: (fn) => {
      mount = fn;
    },
    onUnmounted: (fn) => {
      unmount = fn;
    },
    window: { innerHeight: 1000 },
    motionPaused,
    subscribeBevelScroll: subscribe(scroll),
    subscribeBevelResize: subscribe(resize),
    requestBevelResize() {
      calls.invalidations++;
      resize.forEach((fn) => fn());
    },
    IntersectionObserver: class {
      constructor(fn) {
        onVisibility = fn;
      }
      observe() {}
      disconnect() {
        calls.disconnected++;
      }
    },
    ResizeObserver: class {
      constructor(fn) {
        onResize = fn;
      }
      observe() {}
      disconnect() {
        calls.disconnected++;
      }
    },
    gsap: {
      quickTo(state, key, options) {
        const tween = (value) => {
          calls.targets.push(value);
          state[key] = value;
          options.onUpdate();
        };
        tween.tween = {
          pause() {},
          kill() {
            calls.killed++;
          },
        };
        return tween;
      },
    },
  };
  vm.runInContext(
    source +
      `
    container.value = { getBoundingClientRect() { calls.reads++; return rect; } };
    frames.value = { style: { setProperty(key, value) { styles[key] = value; } } };
  `,
    vm.createContext({ ...context, calls, rect, styles }),
  );
  mount();
  return {
    calls,
    rect,
    styles,
    scroll,
    resize,
    mount,
    unmount,
    visible(value) {
      onVisibility([{ isIntersecting: value }]);
    },
    pause(value) {
      motionPaused.value = value;
      onMotion(value);
    },
    resizeContent() {
      onResize();
    },
    scrollPage() {
      scroll.forEach((fn) => fn());
    },
  };
}

test("visible brackets use the previous bevel distance curve and clamp at 100%", () => {
  const frame = mountBracket();
  frame.scrollPage();
  assert.equal(frame.calls.reads, 0);
  frame.visible(true);
  assert.equal(frame.styles["--bracket-clip"], "0%");
  frame.rect.top = 400;
  frame.scrollPage();
  assert.equal(frame.calls.targets.at(-1), 30);
  frame.rect.top = 2000;
  frame.scrollPage();
  assert.equal(frame.calls.targets.at(-1), 100);
  frame.unmount();
});

test("pause and offscreen states stop scroll work; resume refreshes geometry", () => {
  const frame = mountBracket();
  frame.visible(true);
  frame.pause(true);
  assert.equal(frame.styles["--bracket-clip"], "0%");
  assert.equal(frame.scroll.size, 0);
  const reads = frame.calls.reads;
  frame.resizeContent();
  frame.scrollPage();
  assert.equal(frame.calls.reads, reads);
  frame.rect.top = 400;
  frame.pause(false);
  assert.equal(frame.styles["--bracket-clip"], "30%");
  frame.visible(false);
  assert.equal(frame.scroll.size, 0);
  assert.equal(frame.resize.size, 0);
  frame.unmount();
});

test("content resize invalidates visible geometry; unmount releases all resources", () => {
  const frame = mountBracket();
  frame.visible(true);
  frame.rect.height = 1000;
  frame.resizeContent();
  assert.equal(frame.calls.invalidations, 1);
  assert.equal(frame.calls.targets.at(-1), 30);
  frame.unmount();
  assert.equal(frame.scroll.size, 0);
  assert.equal(frame.resize.size, 0);
  assert.equal(frame.calls.disconnected, 2);
  assert.equal(frame.calls.killed, 1);
});
