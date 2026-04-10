<template>
  <DataImport ref="dataImport" />
  <div class="divider">⮟ To Tydi representation ⮟</div>
  <BlocklyCanvas ref="blockly" />
  <div class="divider">⮟ Physical streams and transfer simulation ⮟</div>
  <StreamVisualizer v-if="store.streamVisualized" />
  <div v-else>
    <em>Create a Tydi structure to get started with the visualization</em>
  </div>
<!--  <stream-simulator />-->
</template>

<script lang="ts" setup>
import BlocklyCanvas from './components/BlocklyCanvas.vue'
import DataImport from "@/components/DataImport.vue";
import StreamVisualizer from "@/components/StreamVisualizer.vue";
import {useMainStore} from "@/stores/mainStore.ts";
// import StreamSimulator from "@/components/StreamSimulator.vue";

const store = useMainStore()

</script>

<style>

@reference "./assets/main.css";

.block-mapping-text {
  opacity: 0.65;
}

</style>
