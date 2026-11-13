import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {
  groupTechnologies,
  categoryKeyAt,
} from "../src/utils/technologyCategories.js";

const technologies = [
  {
    id: 1,
    title: "One",
    featured_media: "/one.svg",
    category: {
      key: "second",
      labels: { pl: "Druga", en: "Second" },
      order: 1,
    },
  },
  {
    id: 2,
    title: "Two",
    featured_media: "/two.svg",
    category: {
      key: "first",
      labels: { pl: "Pierwsza", en: "First" },
      order: 0,
    },
  },
  {
    id: 3,
    title: "Three",
    featured_media: "/three.svg",
    category: {
      key: "first",
      labels: { pl: "Pierwsza", en: "First" },
      order: 0,
    },
  },
];

test("WP categories control order and labels while preserving technology identity and icons", () => {
  const groups = groupTechnologies(technologies, "en");
  assert.deepEqual(
    groups.map((g) => g.label),
    ["First", "Second"],
  );
  assert.deepEqual(
    groups[0].technologies.map((t) => t.id),
    [2, 3],
  );
  assert.equal(groups[1].technologies[0], technologies[0]);
  assert.equal(
    groups.flatMap((g) => g.technologies).length,
    technologies.length,
  );
});

test("unassigned technologies remain available; empty data and missing translations are supported", () => {
  assert.deepEqual(groupTechnologies([]), []);
  const unknown = { id: 99, category: null };
  const groups = groupTechnologies([...technologies, unknown]);
  assert.equal(groups.at(-1).label, "Pozostałe");
  assert.equal(groups.at(-1).technologies[0], unknown);
  assert.equal(groupTechnologies(technologies, "de")[0].label, "Pierwsza");
});

test("keyboard navigation wraps, supports Home/End, and leaves native keys alone", () => {
  const groups = groupTechnologies(technologies);
  assert.equal(categoryKeyAt(groups, "first", "ArrowRight"), "second");
  assert.equal(categoryKeyAt(groups, "second", "ArrowRight"), "first");
  assert.equal(categoryKeyAt(groups, "first", "ArrowLeft"), "second");
  assert.equal(categoryKeyAt(groups, "first", "End"), "second");
  assert.equal(categoryKeyAt(groups, "second", "Home"), "first");
  for (const key of ["Tab", "Enter", " ", "Escape"])
    assert.equal(categoryKeyAt(groups, "first", key), undefined);
  assert.equal(categoryKeyAt([], "", "Home"), undefined);
});

function mountTechnologies() {
  const source = fs
    .readFileSync(
      new URL("../src/components/Technologies.vue", import.meta.url),
      "utf8",
    )
    .match(/<script setup>([\s\S]*?)<\/script>/)[1]
    .replace(/^import[\s\S]*?;\n/gm, "");
  const visible = { value: true },
    paused = { value: false };
  let changed,
    unmount,
    timerId = 0;
  const timers = new Map(),
    intervals = new Map(),
    played = [];
  const context = vm.createContext({
    defineProps: () => ({
      technologies,
      lang: "en",
      data: {},
      glowInterval: 800,
      glowDuration: 1500,
    }),
    ref: (value) => ({ value }),
    computed: (fn) => ({
      get value() {
        return fn();
      },
    }),
    nextTick: () => Promise.resolve(),
    useElementsRegistry: () => ({
      registerElement() {},
      unregisterElement() {},
    }),
    useVisibility: () => visible,
    motionPaused: paused,
    groupTechnologies,
    watch: (_, fn) => {
      changed = fn;
    },
    onMounted() {},
    onUnmounted: (fn) => {
      unmount = fn;
    },
    setTimeout: (fn) => {
      timers.set(++timerId, fn);
      return timerId;
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: (fn) => {
      intervals.set(++timerId, fn);
      return timerId;
    },
    clearInterval: (id) => intervals.delete(id),
    played,
  });
  vm.runInContext(
    source +
      `
    for (const tech of props.technologies) titleRefs.set(tech.id, { play() { played.push(tech.id); } });
    globalThis.state = {selectedCategory, revealedIds, glowIds};
  `,
    context,
  );
  return {
    timers,
    intervals,
    played,
    state: context.state,
    unmount,
    async change(key, pause = false, inViewport = true) {
      context.state.selectedCategory.value = key;
      paused.value = pause;
      visible.value = inViewport;
      changed([inViewport, pause]);
      await new Promise(setImmediate);
    },
    flush() {
      for (const [id, fn] of [...timers]) {
        if (!timers.has(id)) continue;
        timers.delete(id);
        fn();
      }
    },
  };
}

test("rapid category changes cancel pending reveals and glow only the selected category", async () => {
  const tech = mountTechnologies();
  await tech.change("first");
  await tech.change("second");
  tech.flush();
  assert.deepEqual(tech.played, [1]);
  assert.deepEqual([...tech.state.glowIds.value], [1]);
  await tech.change("first");
  assert.equal(tech.state.glowIds.value.size, 0);
  tech.flush();
  assert.deepEqual(tech.played, [1, 2, 3]);
  assert([...tech.state.glowIds.value].every((id) => [2, 3].includes(id)));
  tech.unmount();
  assert.equal(tech.timers.size, 0);
  assert.equal(tech.intervals.size, 0);
});

test("pause reveals all icons without timers; offscreen and unmount cancel deferred work", async () => {
  const tech = mountTechnologies();
  await tech.change("first", true);
  assert.equal(tech.state.revealedIds.value.size, 3);
  assert.equal(tech.timers.size, 0);
  await tech.change("second", false, false);
  assert.equal(tech.timers.size, 0);
  const pending = tech.change("first");
  tech.unmount();
  await pending;
  assert.equal(tech.timers.size, 0);
  assert.equal(tech.intervals.size, 0);
});
