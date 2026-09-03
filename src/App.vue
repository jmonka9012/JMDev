<script setup>
import CustomCursor from "./components/Partials/CustomCursor.vue";
</script>

<template>
  <CustomCursor />
  <RouterView v-slot="{ Component }">
    <Suspense>
      <component :is="Component" />
    </Suspense>
  </RouterView>
</template>

<style>
body {
  overflow: visible;
}

html {
  overflow: visible;
}
</style>