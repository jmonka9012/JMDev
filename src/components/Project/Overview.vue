<script setup>
import ScrambleText from "../Partials/ScrambleText.vue";
import CustomButton from "../Partials/CustomButton.vue";
import ScrollBracketContainer from "../Partials/ScrollBracketContainer.vue";

import { sanitizeProjectHtml } from "../../utils/projectContent.js";

defineProps({
  overview: {
    type: String,
    default: "",
  },
  technologyGroups: {
    type: Array,
    default: () => [],
  },
  liveUrl: {
    type: String,
    default: "",
  },
  copy: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <ScrollBracketContainer
    v-if="overview || technologyGroups.length || liveUrl"
    id="project-overview"
    class="project-overview project-section"
    as="section"
    labelled-by="project-overview-title"
  >
    <div class="project-section-heading">
      <ScrambleText
        id="project-overview-title"
        class="project-overview__title"
        tag="h2"
        :text="copy.overview"
      />

      <span class="project-micro">01 / {{ copy.overview }}</span>
    </div>

    <div class="project-overview__grid">
      <div class="project-overview__content">
        <div v-if="overview" class="project-rich" v-html="overview"></div>

        <CustomButton
          class="project-overview__button"
          v-if="liveUrl"
          :key="copy.visit"
          :link="liveUrl"
          :text="copy.visit"
          rel="noopener noreferrer"
        />
      </div>

      <aside v-if="technologyGroups.length" class="project-technologies">
        <h3 class="project-technologies__heading project-micro">
          {{ copy.technologies }}
        </h3>

        <section
          v-for="group in technologyGroups"
          :key="group.key"
          class="project-technologies__group"
          :aria-labelledby="`project-tech-${group.key}`"
        >
          <h4
            :id="`project-tech-${group.key}`"
            class="project-technologies__category"
          >
            {{ group.label }}
          </h4>

          <ul class="project-technologies__list">
            <li
              v-for="tech in group.technologies"
              :key="tech.id"
              class="project-technologies__item"
            >
              <img
                class="project-technologies__icon"
                v-if="tech.featured_media"
                v-svg-inject
                :src="tech.featured_media"
                alt=""
                loading="lazy"
              />
              <span v-html="sanitizeProjectHtml(tech.title)"></span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </ScrollBracketContainer>
</template>

<style scoped lang="scss">
.project-overview {
  &__title {
    flex-shrink: 0;
    white-space: nowrap;

    :deep(.scramble-animation) {
      white-space: nowrap;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr);
    gap: 64px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 28px;
    max-width: 74ch;
  }

  .project-overview__button {
    margin-top: auto;
  }

  @media (max-width: 1199px) {
    &__grid {
      gap: 36px;
    }
  }

  @media (max-width: 767px) {
    &__grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
}

.project-technologies {
  padding-left: 32px;
  border-left: 1px solid var(--project-divider);

  &__heading {
    margin-bottom: 28px;
    color: var(--main-color);
  }

  &__group + &__group {
    margin-top: 26px;
  }

  &__category {
    margin-bottom: 14px;
    font: 11px/1.6 monospace;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: #b4bdb1;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px 18px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0;
    font-size: 22px;
    line-height: 1.2;
    overflow-wrap: anywhere;

    &::before {
      display: none;
    }
  }

  &__icon,
  :deep(svg) {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  :deep(svg),
  :deep(svg path) {
    fill: white !important;
  }

  @media (max-width: 1199px) {
    &__list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    padding: 24px 0 0;
    border-left: 0;
    border-top: 1px solid var(--project-divider);

    &__list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    &__icon,
    :deep(svg) {
      width: 26px;
      height: 26px;
    }
  }
}
</style>
