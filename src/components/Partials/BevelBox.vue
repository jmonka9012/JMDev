<script setup>
import { ref, onMounted, onUnmounted, inject, computed } from 'vue';
import { useVisibility } from "../../utils/useVisibility.js";
import {throttle} from "../../utils/throttle.js";
import { gsap } from "gsap";

const lenis = inject('lenis');
const mousePos = inject('mousePos');
const isTouch = inject('isTouch');

const emit = defineEmits(['emitRect', 'emitVisibility']);

const props = defineProps({
  activeSides: {
    type: String,
    default: 'top right bottom left'
  },
  maxDistMultiplier: {
    type: Number,
    default: 1
  },
  maxDistance: {
    type: Number,
    default: -1
  },
  cbbChild: {
    type: Boolean,
    default: false
  },
})

const innerBox = ref();
const outerBox = ref();

const box = {
  inner : innerBox,
  outer : outerBox
}

const isVisible = useVisibility(outerBox);

defineExpose({
  isVisible
})

const areaConfig = {
  0: false,
  1: {
    outer: { top: 'light', right: 'dark', bottom: 'dark', left: 'light' },
    inner: { top: 'dark', right: 'light', bottom: 'light', left: 'dark' }
  },
  2: {
    outer: { top: 'light', right: 'dark', bottom: 'dark', left: 'dark' },
    inner: { top: 'dark', right: 'light', bottom: 'light', left: 'light' }
  },
  3: {
    outer: { top: 'light', right: 'light', bottom: 'dark', left: 'dark' },
    inner: { top: 'dark', right: 'dark', bottom: 'light', left: 'light' }
  },
  4: {
    outer: { top: 'dark', right: 'dark', bottom: 'dark', left: 'light' },
    inner: { top: 'light', right: 'light', bottom: 'light', left: 'dark' }
  },
  5: {
    outer: { top: 'dark', right: 'dark', bottom: 'dark', left: 'dark' },
    inner: { top: 'light', right: 'light', bottom: 'light', left: 'light' }
  },
  6: {
    outer: { top: 'dark', right: 'light', bottom: 'dark', left: 'dark' },
    inner: { top: 'light', right: 'dark', bottom: 'light', left: 'light' }
  },
  7: {
    outer: { top: 'dark', right: 'dark', bottom: 'light', left: 'light' },
    inner: { top: 'light', right: 'light', bottom: 'dark', left: 'dark' }
  },
  8: {
    outer: { top: 'dark', right: 'dark', bottom: 'light', left: 'dark' },
    inner: { top: 'light', right: 'light', bottom: 'dark', left: 'light' }
  },
  9: {
    outer: { top: 'dark', right: 'light', bottom: 'light', left: 'dark' },
    inner: { top: 'light', right: 'dark', bottom: 'dark', left: 'light' }
  }
}

const varNames = {
  inner: { top: '--bb-i-t', right: '--bb-i-r', bottom: '--bb-i-b', left: '--bb-i-l' },
  outer: { top: '--bb-o-t', right: '--bb-o-r', bottom: '--bb-o-b', left: '--bb-o-l' }
};

const colorScheme = {
  dark: {
    darkest: '#013801',
    lightest: '#005900'
  },
  light: {
    darkest: '#50ff50',
    lightest: '#b4ffb4'
  }
}

const SIDES = ['top', 'right', 'bottom', 'left'];
const LAYERS = ['inner', 'outer'];

const activeSidesSrc = computed(() => props.activeSides.split(" "));
let dists = {};
let iBox = {};
let rect;

const maxDistance = (a, b) => {
  if (props.maxDistance !== -1) return props.maxDistance;
  return (a + b) * props.maxDistMultiplier;
}

const interpolateHex = (hex1, hex2, t) => {
  const c1 = parseInt(hex1.substring(1), 16);
  const c2 = parseInt(hex2.substring(1), 16);

  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;

  const r = (r1 + (r2 - r1) * t) | 0;
  const g = (g1 + (g2 - g1) * t) | 0;
  const b = (b1 + (b2 - b1) * t) | 0;

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const calcPos = () => {
  if (!rect) return { l: 0, r: 0, t: 0, b: 0 };
  const l = rect.left;
  const r = rect.right;
  const t = rect.top;
  const b = rect.bottom;

  return {l,r,t,b};
}

const returnArea = (b, mouseX, mouseY) => {
  const above = mouseY < b.t;
  const below = mouseY > b.b;
  const onLeft = mouseX < b.l;
  const onRight = mouseX > b.r;

  if (!above && !below && !onLeft && !onRight) return 5;
  if (above && onLeft) return 1;
  if (above && (!onLeft && !onRight)) return 2;
  if (above && onRight) return 3;
  if (onLeft && (!above && !below)) return 4;
  if (onRight && (!above && !below)) return 6;
  if (below && onLeft) return 7;
  if (below && (!onRight && !onLeft)) return 8;
  return 9;
}

const calcDists = (area, outsideTop, outsideBottom, outsideLeft, outsideRight, iBox, b, mouseX, mouseY) => {
  dists = {};
  if (area === 5) {
    dists.top = Math.abs(mouseY - b.t);
    dists.bottom = Math.abs(mouseY - b.b);
    dists.left = Math.abs(mouseX - b.l);
    dists.right = Math.abs(mouseX - b.r);
  }
  else if (area === 2 || area === 8) {
    dists.top = Math.abs(mouseY - b.t);
    dists.bottom = Math.abs(mouseY - b.b);

    const dy = outsideTop ? mouseY - b.t : mouseY - b.b;
    dists.left = Math.hypot(mouseX - b.l, dy);
    dists.right = Math.hypot(mouseX - b.r, dy);
  }
  else if (area === 4 || area === 6) {
    dists.left = Math.abs(mouseX - b.l);
    dists.right = Math.abs(mouseX - b.r);

    const dx = outsideLeft ? mouseX - b.l : mouseX - b.r;
    dists.top = Math.hypot(dx, mouseY - b.t);
    dists.bottom = Math.hypot(dx, mouseY - b.b);
  }
  else if (area === 1 || area === 3 || area === 7 || area === 9) {
    const closestX = mouseX < b.l ? b.l : b.r;
    const closestY = mouseY < b.t ? b.t : b.b;

    const dx = mouseX - closestX;
    const dy = mouseY - closestY;

    const boxDist = Math.hypot(dx, dy);

    dists.left = outsideLeft ? boxDist : boxDist + iBox.offsetWidth;
    dists.right = outsideRight ? boxDist : boxDist + iBox.offsetWidth;
    dists.top = outsideTop ? boxDist : boxDist + iBox.offsetHeight;
    dists.bottom = outsideBottom ? boxDist : boxDist + iBox.offsetHeight;
  }

  return dists;
}

const handleBorders = () => {
  if (isVisible.value || init === false) {
    init = true;

    // Pobieramy dane z globalnego state'u z uwzględnieniem dotyku
    const mouseX = isTouch?.value ? window.innerWidth / 2 : (mousePos?.x?.value || 0);
    const mouseY = isTouch?.value ? window.innerHeight / 2 : (mousePos?.y?.value || 0);

    const b = calcPos();
    const activeSides = activeSidesSrc.value;

    const outsideTop = mouseY < b.t;
    const outsideBottom = mouseY > b.b;
    const outsideLeft = mouseX < b.l;
    const outsideRight = mouseX > b.r;

    const area = returnArea(b, mouseX, mouseY);
    dists = calcDists(area, outsideTop, outsideBottom, outsideLeft, outsideRight, iBox, b, mouseX, mouseY);

    let bordersConfig = areaConfig[area];
    const maxDist = maxDistance(iBox.offsetWidth, iBox.offsetHeight);

    for (const side of SIDES) {
      const distance = dists[side];
      if (distance !== undefined && activeSides.includes(side)) {
        for (const layer of LAYERS) {
          updateBorder(layer, side, bordersConfig, maxDist, distance);
        }
      }
    }
  }
  return 1;
}

const updateBorder = (layer, side, bordersConfig, maxDist, distance) => {
  const variableName = varNames[layer][side];
  const config = bordersConfig[layer][side];

  const minColor = colorScheme[config].lightest;
  const maxColor = colorScheme[config].darkest;

  let relativeDist = Math.min(distance / maxDist, 1);
  const targetColor = interpolateHex(minColor, maxColor, relativeDist);

  gsap.to(box[layer].value, {
    [variableName]: targetColor,
    duration: 2.4,
    ease: "power2.out",
    overwrite: "auto"
  });
}

let ticking = false;
let init = false;

const update = () => {
  handleBorders();
  ticking = false;
};

const onMouseMove = () => {
  if (!ticking) {
    window.requestAnimationFrame(update);
    ticking = true;
  }
};

const onResize = () => {
  iBox = {
    offsetWidth: innerBox.value.offsetWidth,
    offsetHeight: innerBox.value.offsetHeight
  };
}
const onScroll = () => {
  if (!innerBox.value) return;
  rect = innerBox.value.getBoundingClientRect();
  if (props.cbbChild) emit('emitRect', rect);

  if (!ticking) {
    window.requestAnimationFrame(update);
    ticking = true;
  }
}

onMounted(() => {
  iBox = {
    offsetWidth: innerBox.value.offsetWidth,
    offsetHeight: innerBox.value.offsetHeight
  };
  rect = innerBox.value.getBoundingClientRect();
  if (props.cbbChild) emit('emitRect', rect);

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  onMouseMove();
  lenis.on('scroll', onScroll);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', onResize);
  lenis.off('scroll', onScroll);
})
</script>

<template>
  <div ref="outerBox" class="bevel-box__outer bevel-box" :class="props.activeSides">
    <div ref="innerBox" class="bevel-box__inner debug">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Twój styl SCSS pozostaje całkowicie bez zmian */
.bevel-box {
  --b-width: 5px;

  &__inner, &__outer {
    border: var(--b-width) solid;
    box-sizing: border-box;
  }

  &__inner {
    width: inherit;
    height: inherit;
    border-radius: inherit;
    border-top-color: var(--bb-i-t);
    border-right-color: var(--bb-i-r);
    border-bottom-color: var(--bb-i-b);
    border-left-color: var(--bb-i-l);
  }

  &__outer {
    border-top-color: var(--bb-o-t);
    border-right-color: var(--bb-o-r);
    border-bottom-color: var(--bb-o-b);
    border-left-color: var(--bb-o-l);
  }

  &.top, &.top &__inner, &.right, &.right &__inner, &.bottom, &.bottom &__inner, &.left, &.left &__inner{
    border-width: 0;
  }

  &.top, &.top &__inner {
    border-top-width: var(--b-width);
  }

  &.right, &.right &__inner {
    border-right-width: var(--b-width);
  }

  &.bottom, &.bottom &__inner {
    border-bottom-width: var(--b-width);
  }

  &.left, &.left &__inner {
    border-left-width: var(--b-width);
  }
}
</style>