<script setup>
import ScrollBevelContainer from "./Partials/ScrollBevelContainer.vue";
import ScrambleText from "./Partials/ScrambleText.vue";
import { fadeIn } from "../utils/animations.js";
import { useElementsRegistry } from "../utils/useRegistry.js";
import { onMounted, onUnmounted, ref } from "vue";
import gsap from "gsap";
const { registerElement, unregisterElement } = useElementsRegistry();

const myId = "experience";
const jobEl = ref(null);
const eduEl = ref(null);

const props = defineProps({
  data: { type: Object, required: true },
  lang: { type: String, required: false },
});

const years = [2021, 2022, 2023, 2024, 2025, 2026];

const animateExperience = (containerEl) => {
  fadeIn(containerEl, 1.5, 0, 0, 0);

  if (jobEl.value) fadeIn(jobEl.value, 1, 1.5, -40, -40);
  if (eduEl.value) fadeIn(eduEl.value, 1, 1, -40, 40);
};

onMounted(() => {
  registerElement({
    id: myId,
    title: props.data.menu_name,
  });
});

onUnmounted(() => {
  unregisterElement(myId);
});
</script>

<template>
  <ScrollBevelContainer
    :tracked="false"
    :id="myId"
    v-on-enter="animateExperience"
    class="js-hidden"
  >
    <ScrambleText class="mb-20" tag="h2" :text="data.heading"></ScrambleText>

    <div class="mb-30 mt-30">
      <div class="timeline">
        <div v-for="year in years" :key="year" class="timeline__year">
          <span>{{ year }}</span>
        </div>

        <div ref="jobEl" class="timeline__job js-hidden">
          <div class="relative">
            <span
              ><span>{{ data.work_heading }}</span></span
            >
          </div>
        </div>

        <div ref="eduEl" class="timeline__education js-hidden">
          <div class="relative">
            <span
              ><span>{{ data.education_heading }}</span></span
            >
          </div>
        </div>
      </div>
    </div>

    <div class="experience-description">
      <div>
        <ScrambleText
          class="mb-10"
          :text="data.work_heading"
          tag="h3"
        ></ScrambleText>
        <div class="experience-item" v-html="data.work_description"></div>
      </div>
      <div>
        <ScrambleText
          class="mb-10"
          :text="data.education_heading"
          tag="h3"
        ></ScrambleText>
        <div class="experience-item" v-html="data.education_description"></div>
      </div>
    </div>
  </ScrollBevelContainer>
</template>

<style scoped lang="scss">
.experience-item {
  padding-left: 30px;
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 10px;

  &::before {
    content: "";
    width: 20px;
    height: 20px;
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 3px;
    background-color: var(--main-color);
  }

  strong {
    margin-bottom: 20px;
    display: inline-flex;
  }
}

.experience-description {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @include media-breakpoint-down(lg) {
    grid-template-columns: 1fr;
  }
}

.timeline {
  width: 100%;
  display: flex;
  justify-content: stretch;
  position: relative;
  height: 70px;
  align-items: center;
  margin-top: 55px;
  margin-bottom: 55px;

  &::before {
    content: "";
    width: 100%;
    top: 50%;
    border-bottom: 2px solid white;
    position: absolute;
    height: 0;
    transform: translateY(-50%);
  }

  &__year {
    width: 100%;
    border-left: 3px solid white;
    position: relative;
    display: flex;
    align-items: start;
    justify-content: center;
    font-size: 18px;

    &:last-child {
      border-right: 1px solid white;
    }

    span {
      transform: translateY(-10px);
    }

    @include media-breakpoint-down(md) {
      font-size: 14px;
    }
  }

  &__job,
  &__education {
    position: absolute;
    height: 10px;
    border-left: 3px solid var(--main-color);
    display: flex;
    justify-content: center;
    font-size: 24px;
    text-align: center;

    @include media-breakpoint-down(lg) {
      font-size: 18px;
    }

    .relative {
      height: fit-content;
      width: fit-content;

      &::before {
        position: absolute;
        content: "";
        left: 50%;
        border-left: 3px solid var(--main-color);
        height: 10px;
      }

      span {
        display: flex;
      }
    }
  }

  &__job {
    left: 43.04%;
    border-top: 3px solid var(--main-color);
    right: 4.2%;
    top: 0;

    .relative {
      transform: translateY(-100%);

      &::before {
        bottom: 0;
      }

      & > span {
        padding-bottom: 14px;
      }
    }
  }

  &__education {
    left: 13.9%;
    right: 20%;
    border-bottom: 3px solid var(--main-color);
    bottom: 0;
    border-right: 3px solid var(--main-color);

    .relative {
      //transform: translateY(calc(100%));
      transform: translateY(10px);

      &::before {
        top: 0;
      }

      & > span {
        padding-top: 14px;
      }
    }
  }
}
</style>
