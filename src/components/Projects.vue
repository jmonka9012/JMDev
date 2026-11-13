<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { useElementsRegistry } from "../utils/useRegistry.js";
import ScrambleText from "./Partials/ScrambleText.vue";
import CustomButton from "./Partials/CustomButton.vue";
import {
  projectThumbnail,
  sanitizeProjectHtml,
} from "../utils/projectContent.js";

const { registerElement, unregisterElement } = useElementsRegistry();
const myId = "projects";

const props = defineProps({
  data: { type: Object, required: true },
  lang: { type: String, required: false },
  projects: { type: Array, required: true },
  imageManifest: { type: Object, required: true },
});

const buttonText = computed(() => (props.lang === "pl" ? "zobacz" : "view"));
const projectTypeLabels = computed(() =>
  props.lang === "pl"
    ? { commercial: "Komercyjny", personal: "Osobisty" }
    : { commercial: "Commercial", personal: "Personal" },
);
const projectImageSizes =
  "(max-width: 767.98px) 100vw, (max-width: 1023.98px) 50vw, (max-width: 1399.98px) 33vw, 420px";

const cards = computed(() =>
  props.projects.map((post) => {
    const thumbnail = projectThumbnail(post)?.url;
    return {
      ...post,
      projectType: ["commercial", "personal"].includes(
        post.portfolio?.project_type,
      )
        ? post.portfolio.project_type
        : null,
      thumbnail,
      image: props.imageManifest[thumbnail],
      projectUrl:
        (props.lang || post.acf?.lang || "pl") === "pl"
          ? `/projekt/${post.slug}`
          : `/${props.lang || post.acf?.lang}/project/${post.slug}`,
      content: sanitizeProjectHtml(post.excerpt || post.content)
        .replace(/<h[1-3](\b[^>]*)>/gi, "<h4$1>")
        .replace(/<\/h[1-3]>/gi, "</h4>"),
    };
  }),
);

onMounted(() => {
  registerElement({ id: myId, title: props.data.menu_name });
});

onUnmounted(() => {
  unregisterElement(myId);
});
</script>

<template>
  <section :id="myId" aria-labelledby="projects-heading">
    <div class="container projects-container">
      <ScrambleText
        id="projects-heading"
        class="projects-heading"
        mode="write"
        tag="h2"
        :text="data.heading"
      />
      <div class="projects-grid">
        <article v-for="post in cards" :key="post.id" class="project-card">
          <div
            v-if="post.projectType"
            class="project-card__type"
            :class="`project-card__type--${post.projectType}`"
          >
            {{ projectTypeLabels[post.projectType] }}
          </div>
          <picture v-if="post.thumbnail" class="project-card__thumbnail">
            <source
              v-if="post.image?.avifSrcset"
              :srcset="post.image.avifSrcset"
              :sizes="projectImageSizes"
              type="image/avif"
            />
            <source
              v-if="post.image?.webpSrcset"
              :srcset="post.image.webpSrcset"
              :sizes="projectImageSizes"
              type="image/webp"
            />
            <img
              :src="post.thumbnail"
              :width="post.image?.width"
              :height="post.image?.height"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </picture>
          <div class="project-card__body">
            <h3 class="project-card__title">{{ post.title }}</h3>
            <div class="project-card__content" v-html="post.content"></div>
            <CustomButton
              v-if="post.projectUrl"
              class="project-card__button"
              :link="post.projectUrl"
              target="_self"
              :text="buttonText"
              :aria-label="`${buttonText}: ${post.title}`"
            />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.projects-container.container {
  padding-inline: 0;
}

.projects-heading {
  padding-inline: 40px;
  margin-bottom: 48px;

  @include media-breakpoint-down(lg) {
    padding-inline: 26px;
    margin-bottom: 36px;
  }
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;

  @include media-breakpoint-down(lg) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @include media-breakpoint-down(md) {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}

.project-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #375033;
  background: #030503;
  box-shadow:
    0 0 8px rgb(53 255 37 / 0),
    0 0 22px rgb(53 255 37 / 0);
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;

  &:focus-within {
    border-color: #b2ff9e;
    box-shadow:
      0 0 10px rgb(89 255 65 / 0.45),
      0 0 26px rgb(53 255 37 / 0.24);
    transition-duration: 0.25s;
    transition-timing-function: cubic-bezier(0.55, 0, 0.8, 0.55);
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      border-color: #b2ff9e;
      box-shadow:
        0 0 10px rgb(89 255 65 / 0.45),
        0 0 26px rgb(53 255 37 / 0.24);
      transition-duration: 0.25s;
      transition-timing-function: cubic-bezier(0.55, 0, 0.8, 0.55);
    }
  }

  &__type {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 11px 16px;
    border-bottom: 1px solid #344233;
    background: #000;
    color: #f6fff4;
    font: 12px/1.2 monospace;
    letter-spacing: 0.8px;
    text-transform: uppercase;

    &::before {
      content: "";
      flex: 0 0 8px;
      height: 8px;
      box-sizing: border-box;
      border: 1px solid #35ff25;
      background: #35ff25;
    }

    &--personal::before {
      background: transparent;
    }
  }

  &__thumbnail {
    display: block;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    border-bottom: 1px solid #344233;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
    }
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
  }

  &__title {
    margin-bottom: 20px;
    font-size: 38px;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  &__content {
    width: 100%;
    margin-bottom: 24px;
    font-size: 23px;
    line-height: 1.35;
    color: #b4c2b4;
    overflow-wrap: anywhere;

    :deep(p) {
      margin-bottom: 16px;
    }

    :deep(h4) {
      margin: 20px 0 12px;
      font-size: 26px;
    }

    :deep(li) {
      margin-bottom: 8px;
      padding-left: 20px;
      font-size: inherit;

      &::before {
        top: 10px;
        width: 6px;
        height: 6px;
      }
    }

    :deep(> :last-child) {
      margin-bottom: 0;
    }
  }

  &__button {
    margin-top: auto;
  }
}
</style>
