<script setup>
import CustomButton from "../Partials/CustomButton.vue";
import ScrollBracketContainer from "../Partials/ScrollBracketContainer.vue";
import Slider from "./Slider.vue";
defineProps({
  item: { type: Object, required: true },
  index: { type: Number, required: true },
  manifest: { type: Object, default: () => ({}) },
  copy: { type: Object, required: true },
});
</script>
<template>
  <ScrollBracketContainer
    as="article"
    class="project-challenge"
    :class="{ 'project-challenge--text-only': !item.screenshots.length }"
    :labelled-by="`project-challenge-${index}`"
  >
    <header class="project-challenge__heading">
      <span class="project-challenge__number" aria-hidden="true">{{
        String(index + 1).padStart(2, "0")
      }}</span>
      <h3 :id="`project-challenge-${index}`">
        {{ item.title || `${copy.challenge} ${index + 1}` }}
      </h3>
    </header>
    <div class="project-challenge__body">
      <div class="project-challenge__text">
        <section v-if="item.challenge" class="project-challenge__problem">
          <h4><span aria-hidden="true">01 — </span>{{ copy.challenge }}</h4>
          <p>{{ item.challenge }}</p>
        </section>
        <section v-if="item.solution" class="project-challenge__solution">
          <h4><span aria-hidden="true">02 — </span>{{ copy.solution }}</h4>
          <div
            v-if="item.solution"
            class="project-rich"
            v-html="item.solution"
          ></div>
        </section>
        <div
          v-if="item.link_url && !item.screenshots.length"
          class="project-resource-link"
        >
          <CustomButton
            :link="item.link_url"
            :text="item.link_label || copy.material"
            rel="noopener noreferrer"
          />
        </div>
      </div>
      <div v-if="item.screenshots.length" class="project-challenge__media">
        <Slider
          :slides="item.screenshots"
          :manifest="manifest"
          :copy="copy"
          layout="resource"
        />
        <div v-if="item.link_url" class="project-resource-link">
          <CustomButton
            :link="item.link_url"
            :text="item.link_label || copy.material"
            rel="noopener noreferrer"
          />
        </div>
      </div>
      <section v-if="item.effect" class="project-challenge__effect">
        <h4><span aria-hidden="true">03 — </span>{{ copy.effect }}</h4>
        <p>{{ item.effect }}</p>
      </section>
    </div>
  </ScrollBracketContainer>
</template>
