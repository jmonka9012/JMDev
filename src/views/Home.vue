<script setup>
import DivineOrbOptimised from "../components/DivineOrbOptimised.vue";
import Hero from "../components/Hero.vue";
import AboutMe from "../components/AboutMe.vue";
import Projects from "../components/Projects.vue";
import Technologies from "../components/Technologies.vue";
import Strengths from "../components/Strengths.vue";
import Experience from "../components/Experience.vue";
import PageHeader from "../components/PageHeader.vue";
import Footer from "../components/Footer.vue";
import MotionToggle from "../components/Partials/MotionToggle.vue";
import { fadeIn } from "../utils/animations.js";

import { getPageData } from "../utils/getData.js";
import { ref, onMounted, onUnmounted } from "vue";
import { refreshState } from "../utils/refreshState.js";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useHead } from "@unhead/vue";

gsap.registerPlugin(ScrollTrigger);

const isMounted = ref(false);

let observer;

onMounted(() => {
  isMounted.value = true;
  // Keep scroll triggers in sync.
  observer = new ResizeObserver(() => {
    ScrollTrigger.refresh();
  });
  observer.observe(document.body);

  refreshState();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

const lang = props.data.acf.lang;

const seo =
  lang === "pl"
    ? {
        title: "Jacek Mońka - Front-end Developer | JavaScript, Vue.js, PHP",
        description:
          "Jacek Mońka — Front-end Developer z ponad 3-letnim doświadczeniem komercyjnym w tworzeniu stron i aplikacji webowych w JavaScript, Vue.js i PHP.",
        canonical: "https://jmdev.pl/",
        locale: "pl_PL",
        image: "https://jmdev.pl/files/image-3.jpg",
      }
    : {
        title: "Jacek Mońka - Front-end Developer | JavaScript, Vue.js, PHP",
        description:
          "Jacek Mońka is a Front-end Developer with over 3 years of commercial experience building websites and web applications with JavaScript, Vue.js and PHP.",
        canonical: "https://jmdev.pl/en",
        locale: "en_GB",
        image: "https://jmdev.pl/files/image-3.jpg",
      };

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Jacek Mońka",
  url: "https://jmdev.pl/",
  jobTitle: "Front-end Developer",
};

useHead({
  title: seo.title,
  htmlAttrs: {
    lang,
  },
  meta: [
    {
      name: "description",
      content: seo.description,
    },
    { name: "robots", content: "index, follow, max-image-preview:large" },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Jacek Mońka" },
    { property: "og:locale", content: seo.locale },
    { property: "og:url", content: seo.canonical },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:image", content: seo.image },
    { property: "og:image:width", content: "976" },
    { property: "og:image:height", content: "1072" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: seo.image },
  ],
  link: [
    { rel: "canonical", href: seo.canonical },
    { rel: "alternate", hreflang: "pl", href: "https://jmdev.pl/" },
    { rel: "alternate", hreflang: "en", href: "https://jmdev.pl/en" },
    {
      rel: "alternate",
      hreflang: "x-default",
      href: "https://jmdev.pl/",
    },
  ],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify(personSchema),
    },
  ],
});

const technologies = ref([]);
technologies.value = await getPageData("technology/all");

const projects = ref([]);

const projectsPath = lang === "pl" ? "post/all" : "en/post/all";
projects.value = await getPageData(projectsPath);

const fadeInPl = (el) => fadeIn(el, 1.5, 0, 0, 0);
</script>

<template>
  <PageHeader :lang="lang" />
  <MotionToggle :lang="lang" />
  <div class="page-content">
    <div v-if="isMounted" class="fixed" style="top: 0">
      <DivineOrbOptimised />
    </div>
    <main id="main-content" tabindex="-1">
      <Hero :data="data.acf.hero" />
      <AboutMe v-on-enter="fadeInPl" :data="data.acf.about_me" :lang="lang" />
      <Technologies
        v-on-enter="fadeInPl"
        :data="data.acf.technologies"
        :technologies="technologies"
      />
      <Strengths v-on-enter="fadeInPl" :data="data.acf.other_skills" />
      <Projects
        v-on-enter="fadeInPl"
        class="mb-40"
        :data="data.acf.projects"
        :projects="projects"
        :lang="lang"
      />
      <Experience :data="data.acf.experience" :lang="lang" />
    </main>
    <Footer :lang="lang" />
  </div>
</template>

<style lang="scss">
.page-content {
  @include media-breakpoint-down(lg) {
    padding: 0 12px;
  }
}

html,
body {
  margin: 0 !important;
  padding: 0 !important;
}

canvas {
  display: block !important;
  max-width: 100vw;
}
</style>
