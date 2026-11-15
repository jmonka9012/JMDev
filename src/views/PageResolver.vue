<template>
  <component
    v-if="pageData"
    :is="dynamicComponent"
    :key="pageData.id"
    :data="pageData"
  />
  <main v-else id="main-content" tabindex="-1">
    <h1>{{ errorCopy.heading }}</h1>
    <a :href="errorCopy.homeHref">{{ errorCopy.homeLink }}</a>
  </main>
</template>

<script setup>
import { computed, ref, shallowRef, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import { getPageData } from "../utils/getData.js";

// Templates
import HomeTemplate from "./Home.vue";
import ProjectTemplate from "./Project.vue";

const route = useRoute();
const pageData = ref(null);
const dynamicComponent = shallowRef(null);
const errorLang = computed(() => (route.params.lang === "en" ? "en" : "pl"));
const errorCopy = computed(() =>
  errorLang.value === "en"
    ? {
        heading: "404 — Page not found",
        homeLink: "Return to the home page",
        homeHref: "/en",
      }
    : {
        heading: "404 — Nie znaleziono strony",
        homeLink: "Wróć na stronę główną",
        homeHref: "/",
      },
);

const templateMap = {
  home: HomeTemplate,
  project: ProjectTemplate,
};

let loadVersion = 0;
onBeforeUnmount(() => {
  loadVersion++;
});

const loadPage = async () => {
  const version = ++loadVersion;
  let data;
  try {
    data = await getPageData(route.path);
  } catch {
    data = null;
  }
  if (version !== loadVersion) return;
  pageData.value = data;
  if (data) {
    const templateName = route.meta.template || data.acf?.template || "home";
    dynamicComponent.value = templateMap[templateName] || HomeTemplate;
  }
};

useHead(
  computed(() =>
    pageData.value
      ? {}
      : {
          title:
            errorLang.value === "en"
              ? "Page not found | Jacek Mońka"
              : "Nie znaleziono strony | Jacek Mońka",
          htmlAttrs: {
            lang: errorLang.value,
          },
          meta: [{ name: "robots", content: "noindex, follow" }],
        },
  ),
);

await loadPage();
// Vue Router reuses this resolver when navigating between projects.
watch(() => route.path, loadPage);
</script>
