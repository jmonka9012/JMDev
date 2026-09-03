<script setup>
const props = defineProps({
  lang: {
    type: String,
    required: true
  }
})

const footerText = props.lang === 'pl' ? "Wyrażam zgodę na przetwarzanie moich danych osobowych w celu prowadzenia rekrutacji na aplikowane przeze mnie stanowisko" : "I consent to the processing of my personal data for the purpose of the recruitment process for the position I have applied for.";

</script>

<template>
  <div class="container">
    <div class="nota">{{footerText}}</div>
    <div class="mb-10 text-center">2026 - Jacek Mońka, all rights reserved.</div>
  </div>
</template>

<style lang="scss" scoped>
.nota {
  text-align: center;
  margin-bottom: 30px;
}
</style>