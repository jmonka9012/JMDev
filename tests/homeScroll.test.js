import test from "node:test";
import assert from "node:assert/strict";
import {
  rememberHomeScroll,
  prepareHomeReturn,
  takeHomeReturn,
} from "../src/utils/homeScroll.js";

const storage = (t) => {
  const previous = globalThis.window;
  const values = new Map();
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  };
  t.after(() => {
    globalThis.window = previous;
  });
  return values;
};

test("project returns restore each home locale once and survive another document", (t) => {
  storage(t);
  rememberHomeScroll("/", 2400.5);
  rememberHomeScroll("/en", 3100);
  assert.equal(prepareHomeReturn("/"), true);
  assert.equal(takeHomeReturn("/"), 2400.5);
  assert.equal(takeHomeReturn("/"), null);
  assert.equal(prepareHomeReturn("/en"), true);
  assert.equal(takeHomeReturn("/en"), 3100);
  rememberHomeScroll("/", 0);
  assert.equal(prepareHomeReturn("/"), true);
  assert.equal(takeHomeReturn("/"), 0);
});

test("direct entry, other locales and ordinary visits do not request restoration", (t) => {
  storage(t);
  assert.equal(prepareHomeReturn("/"), false);
  rememberHomeScroll("/", 1800);
  assert.equal(takeHomeReturn("/"), null);
  assert.equal(prepareHomeReturn("/en"), false);
  prepareHomeReturn("/");
  assert.equal(takeHomeReturn("/en"), null);
  assert.equal(takeHomeReturn("/"), null);
});

test("invalid positions and blocked storage preserve native navigation", (t) => {
  const values = storage(t);
  for (const value of [-1, NaN, Infinity, "2000"])
    rememberHomeScroll("/", value);
  assert.equal(prepareHomeReturn("/"), false);
  values.set("jmdev-home-scroll", '{"/":-2}');
  assert.equal(prepareHomeReturn("/"), false);
  values.set("jmdev-home-scroll", "invalid json");
  assert.equal(prepareHomeReturn("/"), false);
  Object.defineProperty(window, "sessionStorage", {
    get() {
      throw Error("Storage blocked");
    },
  });
  assert.doesNotThrow(() => rememberHomeScroll("/", 1200));
  assert.equal(prepareHomeReturn("/"), false);
  assert.equal(takeHomeReturn("/"), null);
});
