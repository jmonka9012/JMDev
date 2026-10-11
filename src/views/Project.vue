<script setup>
defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <main id="main-content" tabindex="-1">
    <h1>{{data.title.rendered}}</h1>
  </main>
</template>
