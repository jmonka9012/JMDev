<script setup>
import ScrambleText from "../Partials/ScrambleText.vue";
import CustomButton from "../Partials/CustomButton.vue";
import ScrollBracketContainer from "../Partials/ScrollBracketContainer.vue";
import { sanitizeProjectHtml } from "../../utils/projectContent.js";
defineProps({
  overview: { type: String, default: "" },
  technologyGroups: { type: Array, default: () => [] },
  liveUrl: { type: String, default: "" },
  copy: { type: Object, required: true },
});
</script>
<template>
  <ScrollBracketContainer
    v-if="overview || technologyGroups.length || liveUrl"
    id="project-overview"
    class="project-overview"
    as="section"
    labelled-by="project-overview-title"
  >
    <div class="project-section-heading">
      <ScrambleText
        id="project-overview-title"
        tag="h2"
        :text="copy.overview"
      /><span class="project-micro">01 / {{ copy.overview }}</span>
    </div>
    <div class="project-overview__grid">
      <div class="project-overview__content">
        <div v-if="overview" class="project-rich" v-html="overview"></div>
        <CustomButton
          v-if="liveUrl"
          :key="copy.visit"
          :link="liveUrl"
          :text="copy.visit"
          rel="noopener noreferrer"
        />
      </div>
      <aside v-if="technologyGroups.length" class="project-technologies">
        <h3 class="project-micro">{{ copy.technologies }}</h3>
        <section
          v-for="group in technologyGroups"
          :key="group.key"
          class="project-technology-group"
          :aria-labelledby="`project-tech-${group.key}`"
        >
          <h4 :id="`project-tech-${group.key}`" class="project-micro">
            {{ group.label }}
          </h4>
          <ul>
            <li v-for="tech in group.technologies" :key="tech.id">
              <img
                v-if="tech.featured_media"
                v-svg-inject
                :src="tech.featured_media"
                alt=""
                loading="lazy"
              />
              <span v-html="sanitizeProjectHtml(tech.title)"></span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </ScrollBracketContainer>
</template>
