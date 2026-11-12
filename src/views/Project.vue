<script setup>
import { computed } from "vue";
import { useHead } from "@unhead/vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { A11y, Navigation, Pagination, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ProjectImage from "../components/Partials/ProjectImage.vue";
import CustomButton from "../components/Partials/CustomButton.vue";
import MotionToggle from "../components/Partials/MotionToggle.vue";
import DivineOrbOptimised from "../components/DivineOrbOptimised.vue";
import { getPageData } from "../utils/getData.js";
import { motionPaused } from "../utils/motionPreference.js";
import {
  hasProjectText,
  projectChallenges,
  projectGallery,
  safeProjectUrl,
  sanitizeProjectHtml,
} from "../utils/projectContent.js";

const props = defineProps({ data: { type: Object, required: true } });
const lang = computed(() => props.data.acf?.lang || "pl");
const home = computed(() => (lang.value === "pl" ? "/" : `/${lang.value}`));
const copy = computed(() =>
  lang.value === "pl"
    ? {
        back: "Wróć do projektów",
        overview: "O projekcie",
        technologies: "Technologie",
        challenges: "Wyzwania",
        challenge: "Wyzwanie",
        solution: "Rozwiązanie",
        effect: "Efekt",
        material: "Zobacz materiał",
        outcome: "Podsumowanie",
        visit: "Zobacz realizację",
        gallery: "Galeria projektu",
        previous: "Poprzednie zdjęcie",
        next: "Następne zdjęcie",
        slide: "Zdjęcie {{index}} z {{slidesLength}}",
        pagination: "Przejdź do zdjęcia {{index}}",
      }
    : {
        back: "Back to projects",
        overview: "Overview",
        technologies: "Technologies",
        challenges: "Challenges",
        challenge: "Challenge",
        solution: "Solution",
        effect: "Effect",
        material: "View resource",
        outcome: "Outcome",
        visit: "View live project",
        gallery: "Project gallery",
        previous: "Previous image",
        next: "Next image",
        slide: "Image {{index}} of {{slidesLength}}",
        pagination: "Go to image {{index}}",
      },
);
const manifest = (await getPageData("project-images")) ?? {};
// Technology entries are shared by both language versions in the existing setup.
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
const title = computed(() =>
  sanitizeProjectHtml(props.data.title?.rendered ?? props.data.title ?? ""),
);
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
      title: titleText,
      htmlAttrs: { lang: lang.value },
      meta: [
        { name: "description", content: description },
        { name: "keywords", content: (seo.keywords || []).join(", ") },
        { property: "og:title", content: titleText },
        { property: "og:description", content: description },
        ...(canonical ? [{ property: "og:url", content: canonical }] : []),
      ],
      link: [
        ...(canonical ? [{ rel: "canonical", href: canonical }] : []),
        ...Object.entries(translationPaths.value).map(([locale, route]) => ({
          rel: "alternate",
          hreflang: locale,
          href: `${siteUrl}${route}`,
        })),
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
  <main id="main-content" class="project-page container" tabindex="-1">
    <RouterLink class="project-page__back" :to="`${home}#projects`"
      >← {{ copy.back }}</RouterLink
    >
    <nav v-if="Object.keys(translationPaths).length > 1" aria-label="Language">
      <template v-for="(path, locale) in translationPaths" :key="locale">
        <RouterLink
          v-if="locale !== lang"
          :to="path"
          :hreflang="locale"
          :lang="locale"
          >{{ locale.toUpperCase() }}</RouterLink
        >
      </template>
    </nav>
    <article>
      <header class="project-page__hero">
        <h1 v-html="title"></h1>
        <div
          v-if="subtitle"
          class="project-page__subtitle rich-text"
          v-html="subtitle"
        ></div>
        <div v-if="gallery.length" class="project-page__gallery">
          <Swiper
            v-if="gallery.length > 1"
            :key="data.id"
            :modules="[A11y, Navigation, Pagination, Keyboard]"
            navigation
            :pagination="{ clickable: true }"
            :keyboard="{ enabled: true, onlyInViewport: true }"
            :a11y="{
              containerMessage: copy.gallery,
              prevSlideMessage: copy.previous,
              nextSlideMessage: copy.next,
              slideLabelMessage: copy.slide,
              paginationBulletMessage: copy.pagination,
            }"
            :speed="motionPaused ? 0 : 350"
            :space-between="24"
            :auto-height="true"
          >
            <SwiperSlide
              v-for="(slide, index) in gallery"
              :key="`${index}-${slide.image.url}`"
            >
              <figure>
                <ProjectImage
                  :image="slide.image"
                  :manifest="manifest"
                  :eager="index === 0"
                />
                <figcaption v-if="slide.caption">
                  {{ slide.caption }}
                </figcaption>
              </figure>
            </SwiperSlide>
          </Swiper>
          <figure v-else>
            <ProjectImage
              :image="gallery[0].image"
              :manifest="manifest"
              eager
            />
            <figcaption v-if="gallery[0].caption">
              {{ gallery[0].caption }}
            </figcaption>
          </figure>
        </div>
      </header>

      <section
        v-if="overview || technologies.length || liveUrl"
        class="project-page__section"
        aria-labelledby="project-overview"
      >
        <h2 id="project-overview">{{ copy.overview }}</h2>
        <div v-if="overview" class="rich-text" v-html="overview"></div>
        <div v-if="technologies.length" class="project-page__technologies">
          <h3>{{ copy.technologies }}</h3>
          <ul class="project-page__tags">
            <li v-for="tech in technologies" :key="tech.id">
              <span v-html="sanitizeProjectHtml(tech.title)"></span>
            </li>
          </ul>
        </div>
        <CustomButton v-if="liveUrl" :link="liveUrl" :text="copy.visit" />
      </section>

      <section
        v-if="challenges.length"
        class="project-page__section"
        aria-labelledby="project-challenges"
      >
        <h2 id="project-challenges">{{ copy.challenges }}</h2>
        <article
          v-for="(item, index) in challenges"
          :key="index"
          class="project-page__challenge"
        >
          <h3 v-if="item.title">{{ item.title }}</h3>
          <div v-if="item.challenge">
            <h4>{{ copy.challenge }}</h4>
            <p class="project-page__plain">{{ item.challenge }}</p>
          </div>
          <div v-if="item.solution">
            <h4>{{ copy.solution }}</h4>
            <div class="rich-text" v-html="item.solution"></div>
          </div>
          <div v-if="item.effect">
            <h4>{{ copy.effect }}</h4>
            <p class="project-page__plain">{{ item.effect }}</p>
          </div>
          <div v-if="item.screenshots.length" class="project-page__gallery">
            <figure v-if="item.screenshots.length === 1">
              <ProjectImage
                :image="item.screenshots[0].image"
                :manifest="manifest"
              />
              <figcaption v-if="item.screenshots[0].caption">
                {{ item.screenshots[0].caption }}
              </figcaption>
            </figure>
            <Swiper
              v-else
              :modules="[A11y, Navigation, Pagination, Keyboard]"
              navigation
              :pagination="{ clickable: true }"
              :keyboard="{ enabled: true, onlyInViewport: true }"
              :a11y="{
                containerMessage: copy.gallery,
                prevSlideMessage: copy.previous,
                nextSlideMessage: copy.next,
                slideLabelMessage: copy.slide,
                paginationBulletMessage: copy.pagination,
              }"
              :speed="motionPaused ? 0 : 350"
              :space-between="24"
              :auto-height="true"
            >
              <SwiperSlide
                v-for="(shot, shotIndex) in item.screenshots"
                :key="`${shotIndex}-${shot.image.url}`"
              >
                <figure>
                  <ProjectImage :image="shot.image" :manifest="manifest" />
                  <figcaption v-if="shot.caption">
                    {{ shot.caption }}
                  </figcaption>
                </figure>
              </SwiperSlide>
            </Swiper>
          </div>
          <div v-if="item.link_url" class="project-page__resource">
            <CustomButton
              :key="item.link_label"
              :link="item.link_url"
              :text="item.link_label || copy.material"
              rel="noopener noreferrer"
            />
          </div>
        </article>
      </section>

      <section
        v-if="outcome"
        class="project-page__section"
        aria-labelledby="project-outcome"
      >
        <h2 id="project-outcome">{{ copy.outcome }}</h2>
        <p class="project-page__plain">{{ outcome }}</p>
      </section>
    </article>
  </main>
</template>

<style scoped lang="scss">
.project-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.project-page {
  position: relative;
  z-index: 1;
  padding-top: 100px;
  padding-bottom: 80px;
  font-size: 20px;
  line-height: 1.5;
  --swiper-theme-color: var(--main-color);
  --swiper-navigation-size: 28px;

  &__back {
    display: inline-block;
    margin-bottom: 40px;
    color: var(--main-color);
  }
  &__hero h1 {
    overflow-wrap: anywhere;
  }
  &__subtitle {
    max-width: 900px;
    margin-top: 24px;
    font-size: 24px;
  }
  &__gallery {
    margin-top: 40px;
    border: 2px solid var(--main-color);
    background: #080808;
  }
  &__gallery :deep(img) {
    max-height: 720px;
    object-fit: contain;
    object-position: top;
  }
  &__gallery :deep(.swiper) {
    padding-bottom: 36px;
  }
  &__gallery :deep(.swiper-button-prev),
  &__gallery :deep(.swiper-button-next) {
    background: #000c;
    width: 44px;
    height: 44px;
  }
  figcaption {
    padding: 16px 24px;
  }
  &__section {
    margin-top: 64px;
    padding: 40px;
    border: 2px solid var(--main-color);
    background: #000d;
  }
  &__section > h2 {
    margin-bottom: 32px;
  }
  &__technologies {
    margin: 32px 0;
  }
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }
  &__tags li {
    padding: 6px 14px;
    border: 1px solid var(--main-color);
  }
  &__tags li::before {
    display: none;
  }
  &__challenge + &__challenge {
    margin-top: 40px;
    padding-top: 40px;
    border-top: 1px solid #ffffff40;
  }
  &__challenge h3 {
    margin-bottom: 24px;
  }
  &__challenge h4 {
    margin-bottom: 8px;
  }
  &__challenge > div + div,
  &__challenge > picture {
    margin-top: 24px;
  }
  &__plain {
    white-space: pre-line;
  }
  &__resource {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
  &__resource :deep(.scramble-wrapper) {
    display: inline-block;
    max-width: 100%;
  }
  .rich-text {
    overflow-wrap: anywhere;
  }
  .rich-text :deep(p + p),
  .rich-text :deep(ul),
  .rich-text :deep(ol) {
    margin-top: 16px;
  }
  .rich-text :deep(h2),
  .rich-text :deep(h3),
  .rich-text :deep(h4) {
    margin: 24px 0 12px;
  }
  .rich-text :deep(a) {
    color: var(--main-color);
    text-decoration: underline;
  }
  .rich-text :deep(img) {
    max-width: 100%;
    height: auto;
  }
  .rich-text :deep(ol) {
    list-style: decimal;
    padding-left: 24px;
  }
  .rich-text :deep(pre),
  .rich-text :deep(table) {
    max-width: 100%;
    overflow-x: auto;
  }
  .btn {
    display: inline-block;
    margin-top: 24px;
  }

  @include media-breakpoint-down(md) {
    padding-top: 72px;
    &__section {
      padding: 24px;
      margin-top: 32px;
    }
    &__subtitle {
      font-size: 20px;
    }
    &__hero h1 {
      font-size: 36px;
    }
  }
}
</style>
