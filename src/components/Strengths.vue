<script setup>
import ScrollBevelContainer from "../components/Partials/ScrollBevelContainer.vue";
import ScrambleText from "./Partials/ScrambleText.vue";
import { useElementsRegistry } from "../utils/useRegistry.js";
const { registerElement, unregisterElement } = useElementsRegistry();
import { onMounted, onUnmounted } from "vue";

const myId = "strengths";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

onMounted(() => {
  registerElement({
    id: myId,
    title: props.data.menu_name,
  });
});

onUnmounted(() => {
  unregisterElement(myId);
});
</script>

<template>
  <ScrollBevelContainer :id="myId">
    <ScrambleText
      class="mb-15"
      tag="h2"
      mode="write"
      :text="data.heading"
    ></ScrambleText>
    <div v-html="data.text" class="strengths-wysiwyg ul--big"></div>
  </ScrollBevelContainer>
</template>

<style scoped lang="scss"></style>
