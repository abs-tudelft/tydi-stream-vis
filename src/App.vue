<template>
  <dockview-vue
    @ready="onReady"
    :theme="themeLight"
    style="height: 100%"
  >
  </dockview-vue>
</template>


<script lang="ts">
import BlocklyCanvas from './panels/BlocklyCanvas.vue'
import DataImport from "@/panels/DataImport.vue";
import StreamVisualizer from "@/panels/StreamVisualizer.vue";

export default {
  components: {
    'blockly-canvas': BlocklyCanvas,
    'data-import': DataImport,
    'stream-visualizer': StreamVisualizer,
  }
}
</script>

<script lang="ts" setup>
import {useMainStore} from "@/stores/mainStore.ts";
import {type DockviewReadyEvent, DockviewVue, themeLight} from "dockview-vue";
// import StreamSimulator from "@/components/StreamSimulator.vue";

const store = useMainStore()

function onReady(event: DockviewReadyEvent) {
  const importPanel = event.api.addPanel({
    id: 'data_import',
    component: 'data-import',
    title: "Data import"
  })
  event.api.addPanel({
    id: 'blockly_canvas',
    component: 'blockly-canvas',
    title: "Tydi structure builder",
  })
  event.api.addPanel({
    id: 'stream_visualizer',
    component: 'stream-visualizer',
    title: "Stream visualizer",
  })
  importPanel.api.setActive()
  // event.api.activePanel = importPanel
}

</script>

<style>

@reference "./assets/main.css";

.block-mapping-text {
  opacity: 0.65;
}

</style>
