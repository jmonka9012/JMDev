<script setup>
import ScrollBevelContainer from "../components/Partials/ScrollBevelContainer.vue";
import CustomButton from "./Partials/CustomButton.vue";
import ScrambleText from "./Partials/ScrambleText.vue";
import BevelBox from "./Partials/BevelBox.vue";
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
  <ScrollBevelContainer :id="myId" as="section" labelled-by="about-me-heading">
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
      <BevelBox class="about-me-1__img">
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
      </BevelBox>
    </div>
    <div class="about-me-2">
      <CustomButton
        :text="buttonText"
        target="_self"
        link="mailto:jmonka.kontakt@gmail.com"
      ></CustomButton>
      <div class="text-lg">jmonka.kontakt@gmail.com</div>
    </div>
  </ScrollBevelContainer>
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

  @include media-breakpoint-down(lg) {
    gap: 40px;
  }

  @include media-breakpoint-down(md) {
    grid-template-columns: 1fr;
    gap: 50px;

    &__img {
      order: -1;
      max-width: 200px;
      margin: 0 auto;
    }
  }
}
</style>
