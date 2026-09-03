<script setup>
import { registeredElements } from "../utils/useRegistry.js";
import { inject, onMounted, ref, watch, nextTick } from 'vue';
import { fadeIn } from "../utils/animations.js";

const lenis = inject('lenis');
const menuItems = ref([]);
const activeId = ref(null);
const hasAnimated = ref(false);

const props = defineProps({
  lang: {
    type: String,
    required: true
  }
})

const scrollOptions = {
  offset: -160,
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
}

const scrollTo = (id) => {
  activeId.value = id;
  lenis.scrollTo(`#${id}`, scrollOptions);
}

const animateMenu = async () => {
  if (hasAnimated.value || menuItems.value.length === 0) return;
  hasAnimated.value = true;

  await nextTick();
  menuItems.value.forEach((item, i) => {
    if (item) fadeIn(item, 1.2, .05 * i, -20, -20);
  });
}

watch(() => menuItems.value.length, (newLen) => {
  if (newLen > 0) {
    animateMenu();
  }
});

onMounted(() => {
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeId.value = entry.target.id;

        // Automatyczne centrowanie aktywnego elementu w pociągniętym menu mobilnym
        const activeIndex = registeredElements.value.findIndex(el => el.id === entry.target.id);
        if (activeIndex !== -1 && menuItems.value[activeIndex]) {
          menuItems.value[activeIndex].scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
          });
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  setTimeout(() => {
    registeredElements.value.forEach(item => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });
  }, 300);
});

const langSwapText = props.lang === 'pl' ? 'EN' : 'PL';
</script>

<template>
  <header class="site-header">
    <nav class="menu container">
      <div
          role="button"
          v-for="(item, index) in registeredElements"
          :key="item.id"
          @click="scrollTo(item.id)"
          ref="menuItems"
          class="menu__item js-hidden"
          :class="{ 'is-active': activeId === item.id }"
      >
        {{ item.title }}
      </div>
    </nav>
    <a :href="lang === 'pl' ? '/en' : '/'" class="lang-swap">
      {{ langSwapText }}
    </a>
  </header>
</template>

<style lang="scss" scoped>
.site-header {
  position: fixed;
  top: 0;
  z-index: 10000;
  display: flex;
  width: 100%;
  max-width: 100dvw;
}

.lang-swap {
  position: absolute;
  right: 32px;
  top: 32px;
  z-index: 10;
  font-size: 24px;
  transition: all .2s ease-out;
  padding: 10px 17px;
  
  &:hover {
    color: black;
    background-color: #fff;
  }

  @include media-breakpoint-down(xl) {
    //top: calc(32px + 40px);
    color: black;
    background-color: #fff;
    top: calc(100dvh - 80px)
  }
}

.menu {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 0 auto;
  padding-top: 10px;
  position: relative;

  @include media-breakpoint-down(md) {
    justify-content: flex-start;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    width: 100%;
    padding-left: 20px;
    padding-right: 20px;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &::before {
    --mask-def: radial-gradient(
            ellipse at top,
            black 0%,
            black 30%,
            transparent 70%
    );
    height: 130%;
    max-height: unset;
    content: '';
    position: absolute;
    inset: 0;
    backdrop-filter: blur(12px);
    -webkit-mask-image: var(--mask-def);
    mask-image: var(--mask-def);
    pointer-events: none;
  }

  &__item {
    font-size: 20px;
    font-weight: 300;
    padding: 8px 10px;
    user-select: none;
    z-index: 5;
    position: relative;
    transition: color .2s ease-out;
    white-space: nowrap;

    @include media-breakpoint-down(md) {
      scroll-snap-align: center;
      flex-shrink: 0;
      font-size: 18px;
    }

    &::before, &::after {
      content: '';
      position: absolute;
      inset: 0;
      transition: all .2s ease-out;
      z-index: -1;
      opacity: 0;
    }

    &::before {
      background-color: var(--main-color);
      transform: translate(-10px, -10px);
    }

    &::after {
      background-color: #fff;
      transform: translate(10px, 10px);
    }

    &.is-active, &:hover {
      color: black;
      &::before, &::after {
        opacity: 1;
      }
      &::before {
        transform: translate(-2px, -2px);
      }
      &::after {
        transform: translate(2px, 2px);
      }
    }
  }
}
</style>