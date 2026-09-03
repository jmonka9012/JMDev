<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import BevelBox from "./BevelBox.vue";
import { useScramble } from "../../utils/useScramble.js";

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: false,
  },
  target: {
    type: String,
    required: false,
    default: "_blank",
  },
});

const letters = ref([]);
const { launchFlashAnimation, clearTimeouts } = useScramble();

const handleHover = () => {
  launchFlashAnimation(letters, { flash: { from: 320, to: 500 } });
};

onMounted(() => {
  letters.value = Array.from(props.text).map((char) => ({
    original: char,
    state: { isActive: false, originalChar: char },
    el: null,
    visible: true,
  }));
});

onUnmounted(() => {
  clearTimeouts();
});
</script>

<template>
  <a :href="link" :target="target" class="btn" @mouseenter="handleHover">
    <div class="btn__inner">
      <span class="scramble-wrapper">
        <span class="ghost-text">{{ text }}</span>

        <span class="animating-text">
          <span
            v-for="(item, index) in letters"
            :key="index"
            :ref="
              (el) => {
                if (el) item.el = el;
              }
            "
            class="letter"
          >
            {{ item.original }}
          </span>
        </span>
      </span>
    </div>
  </a>
</template>

<style scoped lang="scss">
.btn {
  position: relative;

  &::before {
    content: "";
    position: absolute;
    inset: 11px;
    background-color: transparent; // Base state.
    transition: background-color 0.3s ease; // Smooth the fade-out when the pointer leaves.
  }

  &:hover {
    &::before {
      animation: bg-glitch-in 0.5s ease-out forwards;
    }
  }

  &__inner {
    padding: 16px 30px;
    position: relative;
    color: #fff;
    text-transform: uppercase;
    transition: color 0.3s ease; // Smooth the return to white when the pointer leaves.
    font-size: 18px;

    &:hover {
      animation: text-glitch-in 0.5s ease-out forwards;
      color: black;

      &::before {
        border-color: var(--main-color);
      }

      &::after {
        border-color: #fff;
      }
    }

    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
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
      bottom: 4px;
      right: 4px;
      border-left: none;
      border-top: none;
      border-color: var(--main-color);
    }

    &:hover::before,
    &:hover::after {
      width: calc(100% - 20px);
      height: calc(100% - 20px);
    }
  }
}

// The remaining code (scramble-wrapper, ghost-text, etc.) remains unchanged.
.scramble-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.ghost-text {
  visibility: hidden;
  pointer-events: none;
}

.animating-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.letter {
  display: inline-block;
  white-space: pre;
  color: inherit;
  transition: color 0.1s;
}

.scramble-btn {
  display: inline-flex;
  padding: 10px 20px 10px;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0);
  font-family: inherit;
  min-width: 130px;
  text-align: center;
  font-size: 24px;
  position: relative;
  text-transform: uppercase;
  transition:
    background-color 0.3s ease-out,
    color 0.3s ease-out;
  justify-content: center;

  &:hover {
    animation: fade-out-sequence 0.7s ease forwards;
  }
}
</style>
