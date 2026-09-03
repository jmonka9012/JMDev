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
import { fadeIn } from "../utils/animations.js";

import { getPageData } from "../utils/getData.js";
import { ref, onMounted, nextTick, onUnmounted } from "vue";
import { refreshState } from "../utils/refreshState.js";
import { registeredElements } from "../utils/useRegistry.js";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

const technologies = ref([]);
technologies.value = await getPageData("technology/all");

const projects = ref([]);

const projectsPath = lang === "pl" ? "post/all" : "en/post/all";
projects.value = await getPageData(projectsPath);

const fadeInPl = (el) => fadeIn(el, 1.5, 0, 0, 0);
</script>

<template>
  <PageHeader :lang="lang" />
  <div class="page-content">
    <div v-if="isMounted" class="fixed" style="top: 0">
      <DivineOrbOptimised />
    </div>
    <Hero :data="data.acf.hero" />
    <AboutMe
      v-on-enter="fadeInPl"
      class="js-hidden"
      :data="data.acf.about_me"
      :lang="lang"
    />
    <Technologies
      v-on-enter="fadeInPl"
      class="js-hidden"
      :data="data.acf.technologies"
      :technologies="technologies"
    />
    <Strengths
      v-on-enter="fadeInPl"
      class="js-hidden"
      :data="data.acf.other_skills"
    />
    <Projects
      v-on-enter="fadeInPl"
      class="mb-40 js-hidden"
      :data="data.acf.projects"
      :projects="projects"
      :lang="lang"
    />
    <Experience class="js-hidden" :data="data.acf.experience" :lang="lang" />
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
