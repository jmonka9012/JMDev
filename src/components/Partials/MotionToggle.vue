<script setup>
import { computed, onMounted, ref } from "vue";
import { motionPaused, toggleMotion } from "../../utils/motionPreference.js";
import playIcon from "../../assets/play-icon.svg";
import pauseIcon from "../../assets/pause-icon.svg";

const props = defineProps({
  lang: {
    type: String,
    required: true,
  },
});

const isMounted = ref(false);
const copy = computed(() => {
  if (props.lang === "pl") {
    return motionPaused.value ? "Wznów animacje" : "Wstrzymaj animacje";
  }

  return motionPaused.value ? "Resume animations" : "Pause animations";
});
const icon = computed(() => (motionPaused.value ? playIcon : pauseIcon));

onMounted(() => {
  isMounted.value = true;
});
</script>

<template>
  <button
    v-if="isMounted"
    type="button"
    class="motion-toggle"
    :class="{ 'motion-toggle--paused': motionPaused }"
    :aria-pressed="motionPaused"
    :aria-label="copy"
    :title="copy"
    @click="toggleMotion"
  >
    <span class="motion-toggle__inner">
      <img class="motion-toggle__icon" :src="icon" alt="" aria-hidden="true" />
    </span>
  </button>
</template>

<style lang="scss" scoped>
.motion-toggle {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10001;
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;

  &::before {
    position: absolute;
    z-index: -1;
    inset: 11px;
    content: "";
    background-color: transparent;
    transition: background-color 0.3s ease;
  }

  &:hover::before {
    animation: bg-glitch-in 0.5s ease-out forwards;
  }

  &__inner {
    position: relative;
    display: flex;
    width: 56px;
    height: 56px;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: color 0.3s ease;

    &::before,
    &::after {
      position: absolute;
      width: 20px;
      height: 20px;
      content: "";
      border: 3px solid;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &::before {
      top: 4px;
      left: 4px;
      border-right: none;
      border-bottom: none;
      border-color: #fff;
    }

    &::after {
      right: 4px;
      bottom: 4px;
      border-top: none;
      border-left: none;
      border-color: var(--main-color);
    }
  }

  &:hover &__inner {
    color: #000;
    animation: text-glitch-in 0.5s ease-out forwards;

    &::before,
    &::after {
      width: calc(100% - 20px);
      height: calc(100% - 20px);
    }
  }

  &__icon {
    position: relative;
    z-index: 1;
    width: 24px;
    height: 24px;
    filter: invert(1);
    transition: filter 0.3s ease;
  }

  &:hover &__icon {
    filter: none;
  }
}
</style>
