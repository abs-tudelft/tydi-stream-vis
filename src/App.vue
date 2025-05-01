<template>
  <div class="w-screen" style="height: 70vh">
    <BlocklyCanvas />
  </div>
  <hr>
  <stream-simulator />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import ComponentBox from './components/StreamSimulator.vue'
import BlocklyCanvas from './components/BlocklyCanvas.vue'
import StreamSimulator from "@/components/StreamSimulator.vue";

</script>

<style scoped>

</style>
