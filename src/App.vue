<template>
  <DataImport ref="dataImport" />
  <div class="divider">⮟ To Tydi representation ⮟</div>
  <BlocklyCanvas @select="selectData" ref="blockly" />
  <div class="divider">⮟ Physical streams and transfer simulation ⮟</div>
  <StreamVisualizer v-if="store.streamVisualized" :stream="store.streamVisualized!" @selectData="selectData" @selectBlock="selectBlock" />
  <div v-else>
    <em>Create a Tydi structure to get started with the visualization</em>
  </div>
<!--  <stream-simulator />-->
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BlocklyCanvas from './components/BlocklyCanvas.vue'
import DataImport from "@/components/DataImport.vue";
import * as Blockly from "blockly/core";
import * as jsonc from 'jsonc-parser';
import {TydiStream, type TydiStreamlet} from "@/Tydi/TydiTypes.ts";
import StreamVisualizer from "@/components/StreamVisualizer.vue";
import {useMainStore} from "@/stores/mainStore.ts";
// import StreamSimulator from "@/components/StreamSimulator.vue";

const store = useMainStore()

const blockly = ref<typeof BlocklyCanvas>()
const dataImport = ref<typeof DataImport>()

function selectData(path: jsonc.JSONPath) {
  dataImport.value!.select(path)
}

function selectBlock(block: Blockly.BlockSvg) {
  blockly.value!.setSelection(block)
}

</script>

<style>

@reference "./assets/main.css";

.block-mapping-text {
  opacity: 0.65;
}

</style>
