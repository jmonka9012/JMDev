<script setup>
import { provide } from "vue";
import CustomCursor from "./components/Partials/CustomCursor.vue";
import { useMouse } from "./utils/useMouse.js";
import { useTouch } from "./utils/useTouch.js";

provide("mousePos", useMouse());
provide("touchPos", useTouch());
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
