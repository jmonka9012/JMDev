<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";

import Hero from "../components/Project/Hero.vue";
import Overview from "../components/Project/Overview.vue";
import Challenges from "../components/Project/Challenges.vue";
import ScrambleText from "../components/Partials/ScrambleText.vue";
import ScrollBracketContainer from "../components/Partials/ScrollBracketContainer.vue";
import CustomButton from "../components/Partials/CustomButton.vue";
import MotionToggle from "../components/Partials/MotionToggle.vue";
import DivineOrbOptimised from "../components/DivineOrbOptimised.vue";

import { groupTechnologies } from "../utils/technologyCategories.js";
import { getPageData } from "../utils/getData.js";
import {
  hasProjectText,
  projectPlainText,
  projectChallenges,
  projectGallery,
  projectThumbnail,
  safeProjectUrl,
  sanitizeProjectHtml,
} from "../utils/projectContent.js";

import { prepareHomeReturn } from "../utils/homeScroll.js";

import "../SCSS/_project.scss";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  preview: Boolean,
});

const route = useRoute();
const lang = computed(() => props.data.acf?.lang || "pl");
const home = computed(() => (lang.value === "pl" ? "/" : `/${lang.value}`));
const returnToHome = (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (!prepareHomeReturn(home.value)) return;
  event.preventDefault();
  window.location.assign(home.value);
};

const copy = computed(() =>
  lang.value === "pl"
    ? {
        back: "Wróć do projektów",
        overview: "O projekcie",
        technologies: "Technologie",
        challenges: "Wyzwania",
        effects: "Efekty",
        challenge: "Wyzwanie",
        solution: "Rozwiązanie",
        effect: "Efekt",
        material: "Zobacz materiał",
        outcome: "Podsumowanie",
        visit: "Zobacz realizację",
        gallery: "Galeria projektu",
        previous: "Poprzednie zdjęcie",
        next: "Następne zdjęcie",
        image: "Zdjęcie",
        slide: "Zdjęcie {{index}} z {{slidesLength}}",
        study: "Realizacja",
        loading: "Wczytywanie projektu…",
      }
    : {
        back: "Back to projects",
        overview: "Overview",
        technologies: "Technologies",
        challenges: "Challenges",
        effects: "Results",
        challenge: "Challenge",
        solution: "Solution",
        effect: "Effect",
        material: "View resource",
        outcome: "Outcome",
        visit: "View live project",
        gallery: "Project gallery",
        previous: "Previous image",
        next: "Next image",
        image: "Image",
        slide: "Image {{index}} of {{slidesLength}}",
        study: "Case study",
        loading: "Loading project…",
      },
);
const manifest = (await getPageData("project-images")) ?? {};
const technologyEntries = (await getPageData("technology/all")) ?? [];

const technologies = computed(() => {
  const references =
    props.data.portfolio?.technology_ids ??
    props.data.acf?.project_technologies ??
    [];
  const ids = new Set(
    (Array.isArray(references) ? references : [references]).map((item) =>
      Number(item?.ID ?? item?.id ?? item),
    ),
  );
  const byId = new Map(
    technologyEntries.map((item) => [Number(item.id), item]),
  );
  return [...ids].map((id) => byId.get(id)).filter(Boolean);
});

const technologyGroups = computed(() =>
  groupTechnologies(technologies.value, lang.value),
);

const title = computed(() =>
  sanitizeProjectHtml(props.data.title?.rendered ?? props.data.title ?? ""),
);
const titleText = computed(() => projectPlainText(title.value));
const subtitle = computed(() =>
  hasProjectText(props.data.excerpt?.rendered)
    ? sanitizeProjectHtml(props.data.excerpt.rendered)
    : "",
);
const overview = computed(() =>
  hasProjectText(props.data.content?.rendered)
    ? sanitizeProjectHtml(props.data.content.rendered)
    : "",
);
const gallery = computed(() => projectGallery(props.data));
const challenges = computed(() => projectChallenges(props.data));
const outcome = computed(() =>
  (
    props.data.portfolio?.outcome ??
    props.data.acf?.project_outcome ??
    ""
  ).trim(),
);
const liveUrl = computed(() =>
  safeProjectUrl(
    props.data.portfolio?.project_url ||
      props.data.acf?.link?.url ||
      props.data.acf?.link,
  ),
);

const translationPaths = computed(
  () => props.data.portfolio?.translations || {},
);
const languageLinks = computed(() =>
  Object.entries(translationPaths.value)
    .filter(([locale]) => locale !== lang.value)
    .map(([locale, path]) => ({
      locale,
      to: props.preview
        ? {
            path: "/design-lab/project",
            query: {
              ...route.query,
              lang: locale,
              project: path.split("/").filter(Boolean).at(-1),
            },
          }
        : path,
      label:
        locale === "en"
          ? "Zmień język na angielski"
          : "Change language to Polish",
    })),
);

const siteUrl = (import.meta.env.VITE_SITE_URL || "https://jmdev.pl").replace(
  /\/$/,
  "",
);

useHead(
  computed(() => {
    const seo = props.data.portfolio?.seo || {};
    const path = translationPaths.value[lang.value];
    const canonical = path ? `${siteUrl}${path}` : null;
    const titleText =
      seo.title ||
      `${projectPlainText(props.data.title?.rendered || "Project")} | Jacek Mońka`;
    const description =
      seo.meta_description ||
      projectPlainText(props.data.excerpt?.rendered || "");
    const image = projectThumbnail(props.data);
    const imageUrl = image ? new URL(image.url, siteUrl).href : null;
    return {
      title: props.preview ? `${titleText} — Design Lab` : titleText,
      htmlAttrs: { lang: lang.value },
      meta: [
        {
          name: "robots",
          content: props.preview ? "noindex, nofollow" : "index, follow",
        },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Jacek Mońka" },
        {
          property: "og:locale",
          content: lang.value === "pl" ? "pl_PL" : "en_GB",
        },
        {
          name: "twitter:card",
          content: imageUrl ? "summary_large_image" : "summary",
        },
        { name: "twitter:title", content: titleText },
        { name: "twitter:description", content: description },
        ...(imageUrl
          ? [
              { property: "og:image", content: imageUrl },
              { property: "og:image:alt", content: image.alt || titleText },
              ...(image.width && image.height
                ? [
                    {
                      property: "og:image:width",
                      content: String(image.width),
                    },
                    {
                      property: "og:image:height",
                      content: String(image.height),
                    },
                  ]
                : []),
              { name: "twitter:image", content: imageUrl },
              { name: "twitter:image:alt", content: image.alt || titleText },
            ]
          : []),
        { property: "og:title", content: titleText },
        { property: "og:description", content: description },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
      ],
      link: props.preview
        ? []
        : [
            ...(canonical ? [{ rel: "canonical", href: canonical }] : []),
            ...Object.entries(translationPaths.value).map(
              ([locale, route]) => ({
                rel: "alternate",
                hreflang: locale,
                href: `${siteUrl}${route}`,
              }),
            ),
            ...(translationPaths.value.pl
              ? [
                  {
                    rel: "alternate",
                    hreflang: "x-default",
                    href: `${siteUrl}${translationPaths.value.pl}`,
                  },
                ]
              : []),
          ],
    };
  }),
);
</script>

<template>
  <div class="project-background" aria-hidden="true">
    <DivineOrbOptimised :show-orb="false" />
  </div>

  <MotionToggle :lang="lang" />

  <RouterLink
    v-for="link in languageLinks"
    :key="link.locale"
    class="project-language"
    :to="link.to"
    :lang="link.locale"
    :hreflang="link.locale"
    :aria-label="link.label"
    >{{ link.locale.toUpperCase() }}</RouterLink
  >

  <main id="main-content" class="project-page" :lang="lang" tabindex="-1">
    <nav class="project-page__nav container">
      <CustomButton
        class="project-page__back"
        :key="lang"
        :link="`${home}#projects`"
        target="_self"
        :text="copy.back"
        @click="returnToHome"
      />
    </nav>

    <article :key="data.id">
      <Hero
        :title="titleText"
        :subtitle="subtitle"
        :gallery="gallery"
        :manifest="manifest"
        :copy="copy"
        :has-challenges="!!challenges.length"
      />

      <Overview
        :overview="overview"
        :technology-groups="technologyGroups"
        :live-url="liveUrl"
        :copy="copy"
      />

      <Challenges :items="challenges" :manifest="manifest" :copy="copy" />

      <ScrollBracketContainer
        v-if="outcome"
        id="project-outcome"
        class="project-outcome project-section"
        as="section"
        labelled-by="project-outcome-title"
      >
        <div class="project-section-heading">
          <ScrambleText
            id="project-outcome-title"
            tag="h2"
            :text="copy.outcome"
          />

          <span class="project-micro">03 / {{ copy.outcome }}</span>
        </div>

        <p>{{ outcome }}</p>
      </ScrollBracketContainer>

      <footer class="project-page__footer container">
        <CustomButton
          class="project-page__back"
          :key="lang"
          :link="`${home}#projects`"
          target="_self"
          :text="copy.back"
          @click="returnToHome"
        />
      </footer>
    </article>
  </main>
</template>

<style scoped lang="scss">
.project-background {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.project-page {
  --project-line: #ffffff30;
  --project-divider: #ffffff85;
  position: relative;
  z-index: 1;
  padding: 44px 0 100px;
  color: #f6fff4;
  font:
    24px/1.45 "Jersey 10",
    monospace;

  &__nav {
    margin-bottom: 64px;
  }
  &__footer {
    display: flex;
    justify-content: flex-end;
  }
  .project-page__back {
    margin: 0;
  }

  @media (max-width: 767px) {
    font-size: 22px;
    padding-top: 28px;

    &__nav {
      margin-bottom: 40px;
    }
    &__footer {
      flex-direction: column;
      align-items: flex-end;
    }
  }
}

.project-language {
  position: fixed;
  right: 32px;
  top: 32px;
  z-index: 10000;
  padding: 10px 17px;
  font: 24px "Determination";
  transition: all 0.2s ease-out;

  &:hover {
    color: black;
    background: white;
  }
  &:focus-visible {
    outline: 2px solid var(--main-color);
    outline-offset: 3px;
  }

  @media (max-width: 1199px) {
    padding: 7px 14px;
    font-size: 20px;
    color: black;
    background: white;
    top: auto;
    bottom: 20px;
    right: 32px;
  }
}

.project-outcome p {
  max-width: 74ch;
}
</style>
