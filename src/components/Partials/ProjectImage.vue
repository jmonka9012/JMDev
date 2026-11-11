<script setup>
defineProps({
  image: { type: Object, required: true },
  manifest: { type: Object, default: () => ({}) },
  sizes: { type: String, default: "(max-width: 1399px) 100vw, 1320px" },
  eager: { type: Boolean, default: false },
});
</script>

<template>
  <picture>
    <source
      v-if="manifest[image.url]?.avifSrcset"
      :srcset="manifest[image.url].avifSrcset"
      :sizes="sizes"
      type="image/avif"
    />
    <source
      v-if="manifest[image.url]?.webpSrcset"
      :srcset="manifest[image.url].webpSrcset"
      :sizes="sizes"
      type="image/webp"
    />
    <img
      :src="image.url"
      :alt="image.alt"
      :width="image.width || manifest[image.url]?.width"
      :height="image.height || manifest[image.url]?.height"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
    />
  </picture>
</template>

<style scoped>
picture,
img {
  display: block;
  width: 100%;
}
img {
  height: auto;
}
</style>
