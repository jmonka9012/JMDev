<script setup>
import {ref, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import { getPageData } from '../utils/getData.js'
import {useHead} from "@vueuse/head";
import {computed} from "vue";

const route = useRoute()
const post = ref(null)

const id = route.params.id;

useHead({
  title: computed(() => post.value ? `${post.value.title.rendered}` : `Post ${id}`),
  meta: [
    {
      name: 'description',
      content: computed(() => post.value ? post.value.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160) : 'Czytaj więcej na naszym blogu')
    },
    {
      property: 'og:title',
      content: computed(() => post.value?.title.rendered)
    }
  ]
})


const data = await getPageData(route.path);

</script>

<template>

  <article>
    <h1>{{ data.title.rendered }}</h1>
    <div class="content" v-html="data.content.rendered"></div>
    <hr/>
    <router-link to="/">← Powrót do listy</router-link>
  </article>

</template>