import { watch } from "vue";

const pointerCallbacks = new Set();
const scrollCallbacks = new Set();
const resizeCallbacks = new Set();

let pointerWatchStop = null;
let pointerSource = null;
let pointerFrame = null;
let scrollFrame = null;
let resizeFrame = null;
let windowListenersActive = false;

const runCallbacks = (callbacks) => {
  callbacks.forEach((callback) => callback());
};

const schedulePointerFrame = () => {
  if (pointerFrame !== null) return;
  pointerFrame = window.requestAnimationFrame(() => {
    pointerFrame = null;
    runCallbacks(pointerCallbacks);
  });
};

const scheduleScrollFrame = () => {
  if (scrollFrame !== null) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null;
    runCallbacks(scrollCallbacks);
  });
};

const scheduleResizeFrame = () => {
  if (resizeFrame !== null) return;
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    runCallbacks(resizeCallbacks);
  });
};

const ensureWindowListeners = () => {
  if (windowListenersActive || typeof window === "undefined") return;
  window.addEventListener("scroll", scheduleScrollFrame, { passive: true });
  window.addEventListener("resize", scheduleResizeFrame, { passive: true });
  windowListenersActive = true;
};

const removeWindowListenersIfUnused = () => {
  if (
    !windowListenersActive ||
    scrollCallbacks.size > 0 ||
    resizeCallbacks.size > 0
  ) {
    return;
  }

  window.removeEventListener("scroll", scheduleScrollFrame);
  window.removeEventListener("resize", scheduleResizeFrame);
  windowListenersActive = false;
};

export const subscribeBevelPointer = (mousePos, callback) => {
  if (!mousePos) return () => {};

  pointerCallbacks.add(callback);

  if (!pointerWatchStop) {
    pointerSource = mousePos;
    pointerWatchStop = watch(
      [() => pointerSource.x.value, () => pointerSource.y.value],
      schedulePointerFrame,
    );
  }

  return () => {
    pointerCallbacks.delete(callback);
    if (pointerCallbacks.size === 0 && pointerWatchStop) {
      pointerWatchStop();
      pointerWatchStop = null;
      pointerSource = null;
    }
  };
};

export const subscribeBevelScroll = (callback) => {
  scrollCallbacks.add(callback);
  ensureWindowListeners();

  return () => {
    scrollCallbacks.delete(callback);
    removeWindowListenersIfUnused();
  };
};

export const subscribeBevelResize = (callback) => {
  resizeCallbacks.add(callback);
  ensureWindowListeners();

  return () => {
    resizeCallbacks.delete(callback);
    removeWindowListenersIfUnused();
  };
};
