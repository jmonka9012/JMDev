<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { groupTechnologies } from "../utils/technologyCategories.js";
import Hero from "../components/Project/Hero.vue";
import Overview from "../components/Project/Overview.vue";
import Challenges from "../components/Project/Challenges.vue";
import ScrambleText from "../components/Partials/ScrambleText.vue";
import ScrollBracketContainer from "../components/Partials/ScrollBracketContainer.vue";
import "../components/Project/project.scss";
import { useHead } from "@unhead/vue";
import CustomButton from "../components/Partials/CustomButton.vue";
import MotionToggle from "../components/Partials/MotionToggle.vue";
import DivineOrbOptimised from "../components/DivineOrbOptimised.vue";
import { getPageData } from "../utils/getData.js";
import {
  hasProjectText,
  projectPlainText,
  projectChallenges,
  projectGallery,
  safeProjectUrl,
  sanitizeProjectHtml,
} from "../utils/projectContent.js";

const props = defineProps({
  data: { type: Object, required: true },
  preview: Boolean,
});
const route = useRoute();
const lang = computed(() => props.data.acf?.lang || "pl");
const home = computed(() => (lang.value === "pl" ? "/" : `/${lang.value}`));
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
      `${props.data.title?.rendered?.replace(/<[^>]*>/g, "") || "Project"} | Jacek Mońka`;
    const description = seo.meta_description || "";
    return {
      title: props.preview ? `${titleText} — Design Lab` : titleText,
      htmlAttrs: { lang: lang.value },
      meta: [
        {
          name: "robots",
          content: props.preview ? "noindex, nofollow" : "index, follow",
        },
        { name: "description", content: description },
        { name: "keywords", content: (seo.keywords || []).join(", ") },
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
    <nav class="project-nav container">
      <CustomButton
        :key="lang"
        :link="`${home}#projects`"
        target="_self"
        :text="copy.back"
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
        class="project-outcome"
        as="section"
        labelled-by="project-outcome-title"
        ><div class="project-section-heading">
          <ScrambleText
            id="project-outcome-title"
            tag="h2"
            :text="copy.outcome"
          /><span class="project-micro">03 / {{ copy.outcome }}</span>
        </div>
        <p>{{ outcome }}</p></ScrollBracketContainer
      >
      <footer class="project-end container">
        <CustomButton
          :key="lang"
          :link="`${home}#projects`"
          target="_self"
          :text="copy.back"
        />
      </footer>
    </article>
  </main>
</template>
