<script setup>
import CustomButton from "../Partials/CustomButton.vue";
import ScrollBracketContainer from "../Partials/ScrollBracketContainer.vue";
import Slider from "./Slider.vue";

defineProps({
  item: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  manifest: {
    type: Object,
    default: () => ({}),
  },
  copy: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <ScrollBracketContainer
    as="article"
    class="project-challenge"
    :class="{ 'project-challenge--text-only': !item.screenshots.length }"
    :labelled-by="`project-challenge-${index}`"
  >
    <header class="project-challenge__heading">
      <span class="project-challenge__number" aria-hidden="true">{{
        String(index + 1).padStart(2, "0")
      }}</span>
      <h3 :id="`project-challenge-${index}`" class="project-challenge__title">
        {{ item.title || `${copy.challenge} ${index + 1}` }}
      </h3>
    </header>

    <div class="project-challenge__body">
      <div class="project-challenge__text">
        <section v-if="item.challenge" class="project-challenge__problem">
          <h4 class="project-challenge__label">
            <span aria-hidden="true">01 — </span>{{ copy.challenge }}
          </h4>
          <p>{{ item.challenge }}</p>
        </section>

        <section v-if="item.solution" class="project-challenge__solution">
          <h4 class="project-challenge__label">
            <span aria-hidden="true">02 — </span>{{ copy.solution }}
          </h4>
          <div
            v-if="item.solution"
            class="project-rich"
            v-html="item.solution"
          ></div>
        </section>

        <div
          v-if="item.link_url && !item.screenshots.length"
          class="project-challenge__resource"
        >
          <CustomButton
            class="project-challenge__button"
            :link="item.link_url"
            :text="item.link_label || copy.material"
            rel="noopener noreferrer"
          />
        </div>
      </div>

      <div v-if="item.screenshots.length" class="project-challenge__media">
        <Slider
          :slides="item.screenshots"
          :manifest="manifest"
          :copy="copy"
          layout="resource"
        />
        <div v-if="item.link_url" class="project-challenge__resource">
          <CustomButton
            class="project-challenge__button"
            :link="item.link_url"
            :text="item.link_label || copy.material"
            rel="noopener noreferrer"
          />
        </div>
      </div>

      <section v-if="item.effect" class="project-challenge__effect">
        <h4 class="project-challenge__label">
          <span aria-hidden="true">03 — </span>{{ copy.effect }}
        </h4>
        <p>{{ item.effect }}</p>
      </section>
    </div>
  </ScrollBracketContainer>
</template>

<style scoped lang="scss">
.project-challenge.container.scroll-bracket {
  padding: 28px 32px 32px;
  margin-bottom: 0;

  @media (max-width: 767px) {
    padding: 24px 26px 28px;
  }
}

.project-challenge {
  &__heading {
    display: flex;
    align-items: baseline;
    gap: 18px;
    margin-bottom: 32px;
  }

  &__title {
    font-size: clamp(26px, 2.6vw, 34px);
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  &__number {
    flex-shrink: 0;
    font:
      28px/1 "Determination",
      monospace;
    color: var(--main-color);
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    align-items: start;
    gap: 28px 56px;
    font-size: 22px;
    line-height: 1.4;

    > section {
      min-width: 0;
    }
    p,
    .project-rich {
      max-width: 76ch;
      overflow-wrap: anywhere;
    }
  }

  &__text {
    grid-column: 1;
    grid-row: 1;
    display: grid;
    gap: 48px;
    width: 100%;
    min-width: 0;
  }

  &__problem {
    grid-column: 1;
    grid-row: 1;
  }
  &__solution {
    grid-column: 1;
    grid-row: 2;
  }

  &__label {
    margin-bottom: 10px;
    font: 11px/1.6 monospace;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: #cbd5c8;

    span {
      color: var(--main-color);
    }
  }

  &__media {
    grid-column: 2;
    grid-row: 1;
    align-self: start;
    min-width: 0;
  }

  &__effect {
    grid-column: 1 / -1;
    grid-row: 2;
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 20px;
    margin-top: 20px;
    padding: 20px 24px;
    background: linear-gradient(90deg, #172415, #080c08);

    .project-challenge__label {
      margin: 4px 0 0;
      color: var(--main-color);
    }
    p {
      max-width: none;
    }
  }

  &__resource {
    display: flex;
    justify-content: flex-end;
    max-width: 100%;
    min-width: 0;
    margin-top: 24px;
  }

  .project-challenge__button {
    margin-top: 0;
  }

  &--text-only {
    .project-challenge__body {
      grid-template-columns: minmax(0, 1fr);
    }

    .project-challenge__text {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
      gap: 36px 56px;

      p,
      .project-rich {
        max-width: none;
      }
    }

    .project-challenge__solution {
      grid-column: 2;
      grid-row: 1;
    }
    .project-challenge__resource {
      grid-column: 2;
      grid-row: 2;
      margin-top: 8px;
    }
  }

  @media (max-width: 767px) {
    &__body {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    &__body > section,
    &__media {
      width: 100%;
    }
    &__text {
      gap: 40px;
    }

    &__effect {
      grid-template-columns: minmax(0, 1fr);
      gap: 8px;
      margin-top: 12px;
      padding: 18px;
    }

    &--text-only {
      .project-challenge__text {
        grid-template-columns: minmax(0, 1fr);
        gap: 32px;
      }
      .project-challenge__solution {
        grid-column: 1;
        grid-row: 2;
      }
      .project-challenge__resource {
        grid-column: 1;
        grid-row: 3;
      }
    }
  }
}
</style>
