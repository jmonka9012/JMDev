<template>
  <div>
    <component v-if="pageData" :is="dynamicComponent" :data="pageData" />
    <div v-else>
      <h1>404 - Nie znaleziono strony</h1>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { getPageData } from "../utils/getData.js";

// Templates
import HomeTemplate from "./Home.vue";
// import DefaultTemplate from './Default.vue'

const route = useRoute();
const pageData = ref(null);
const dynamicComponent = shallowRef(null);

const templateMap = {
  home: HomeTemplate,
};

const loadPage = async () => {
  pageData.value = await getPageData(route.path);

  if (pageData.value) {
    const templateName = pageData.value?.acf?.template || "home";
    dynamicComponent.value = templateMap[templateName] || HomeTemplate;
  }
};

await loadPage();
</script>
