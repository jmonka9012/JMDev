<script setup>
import ScrollBracketContainer from "../components/Partials/ScrollBracketContainer.vue";
import CustomButton from "./Partials/CustomButton.vue";
import ScrambleText from "./Partials/ScrambleText.vue";
import { useElementsRegistry } from "../utils/useRegistry.js";
const { registerElement, unregisterElement } = useElementsRegistry();
import { computed, onMounted, onUnmounted } from "vue";

const myId = "about-me";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  lang: {
    type: String,
    required: false,
  },
  imageManifest: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  registerElement({
    id: myId,
    title: props.data.menu_name,
  });
});

onUnmounted(() => {
  unregisterElement(myId);
});

const buttonText = props.lang === "pl" ? "Napisz do mnie" : "Contact me";
const optimizedPhoto = computed(() => props.imageManifest[props.data.my_photo]);
const photoSizes = "(max-width: 767.98px) 200px, 260px";
</script>

<template>
  <ScrollBracketContainer
    :id="myId"
    as="section"
    labelled-by="about-me-heading"
  >
    <ScrambleText
      class="mb-15"
      id="about-me-heading"
      tag="h2"
      mode="write"
      :text="data.heading"
    ></ScrambleText>
    <div class="about-me-1">
      <div class="about-me-1__content">
        <div class="text-lg text-justify">{{ data.text }}</div>
      </div>
      <div class="about-me-1__profile">
        <div class="about-me-1__img">
          <picture>
            <source
              v-if="optimizedPhoto?.avifSrcset"
              type="image/avif"
              :srcset="optimizedPhoto.avifSrcset"
              :sizes="photoSizes"
            />
            <source
              v-if="optimizedPhoto?.webpSrcset"
              type="image/webp"
              :srcset="optimizedPhoto.webpSrcset"
              :sizes="photoSizes"
            />
            <img
              :src="data.my_photo"
              :alt="data.my_photo_alt"
              :width="optimizedPhoto?.width"
              :height="optimizedPhoto?.height"
              loading="lazy"
              decoding="async"
            />
          </picture>
        </div>
        <a
          class="about-me-1__github"
          href="https://github.com/jmonka9012"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg aria-hidden="true" focusable="false" width="22" height="22">
            <use href="/icons.svg#github-icon" />
          </svg>
          <span>GitHub <span aria-hidden="true">↗</span></span>
        </a>
      </div>
    </div>
    <div class="about-me-2">
      <CustomButton
        :text="buttonText"
        target="_self"
        link="mailto:jmonka.kontakt@gmail.com"
      ></CustomButton>
      <div class="text-lg">jmonka.kontakt@gmail.com</div>
    </div>
  </ScrollBracketContainer>
</template>

<style scoped lang="scss">
.about-me-2 {
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 40px;
  margin-top: 30px;

  @include media-breakpoint-down(lg) {
    flex-direction: column;
    align-items: start;
    gap: 20px;
  }
}

.about-me-1 {
  display: grid;
  grid-template-columns: 1fr 260px;
  align-items: start;
  gap: 120px;

  &__profile {
    display: grid;
    gap: 16px;
    min-width: 0;
  }

  &__github {
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: 10px;
    min-height: 44px;
    padding-block: 6px;
    color: #fff;
    font-size: 22px;
    transition: color 0.2s ease-out;

    svg {
      flex-shrink: 0;
      filter: brightness(0) invert(1);
    }

    &:hover {
      color: var(--main-color);
    }

    &:focus-visible {
      outline: 2px solid var(--main-color);
      outline-offset: 4px;
    }
  }

  &__img {
    padding: 8px;
    border: 1px solid #ffffff28;
    background: #000;
    box-shadow:
      5px 5px 0 #000,
      6px 6px 0 #ffffff35;

    picture,
    img {
      display: block;
      width: 100%;
    }
    img {
      height: auto;
    }
  }

  @include media-breakpoint-down(lg) {
    gap: 40px;
  }

  @include media-breakpoint-down(md) {
    grid-template-columns: 1fr;
    gap: 50px;

    &__profile {
      order: -1;
      max-width: 200px;
      margin: 0 auto;
    }
  }
}
</style>
