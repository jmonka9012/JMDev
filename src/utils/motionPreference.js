import { computed, ref, watch } from "vue";

const STORAGE_KEY = "jmdev-motion-preference";

const systemPrefersReducedMotion = ref(false);
const savedMotionPreference = ref(null);

export const motionPaused = computed(() =>
  savedMotionPreference.value === null
    ? systemPrefersReducedMotion.value
    : savedMotionPreference.value,
);

let isInitialized = false;

const updateDocumentState = (isPaused) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("motion-paused", isPaused);
  document.documentElement.classList.toggle("motion-running", !isPaused);
};

watch(motionPaused, updateDocumentState, { immediate: true });

export const initializeMotionPreference = () => {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  systemPrefersReducedMotion.value = mediaQuery.matches;

  try {
    const savedValue = window.localStorage.getItem(STORAGE_KEY);
    if (savedValue === "paused") savedMotionPreference.value = true;
    if (savedValue === "running") savedMotionPreference.value = false;
  } catch {
    savedMotionPreference.value = null;
  }

  const handlePreferenceChange = (event) => {
    systemPrefersReducedMotion.value = event.matches;
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handlePreferenceChange);
  } else {
    mediaQuery.addListener?.(handlePreferenceChange);
  }
  updateDocumentState(motionPaused.value);
};

export const toggleMotion = () => {
  savedMotionPreference.value = !motionPaused.value;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      savedMotionPreference.value ? "paused" : "running",
    );
  } catch {
    // The reactive preference still works when storage is unavailable.
  }
};
