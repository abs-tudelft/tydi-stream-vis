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
import PacketInspector from "@/panels/PacketInspector.vue";
import CodeGen from "@/panels/CodeGen.vue";

export default {
  components: {
    'blockly-canvas': BlocklyCanvas,
    'data-import': DataImport,
    'stream-visualizer': StreamVisualizer,
    'packet-inspector': PacketInspector,
    'code-gen': CodeGen,
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
  const blocklyPanel = event.api.addPanel({
    id: 'blockly_canvas',
    component: 'blockly-canvas',
    title: "Tydi structure builder",
  })
  const visualizerPanel = event.api.addPanel({
    id: 'stream_visualizer',
    component: 'stream-visualizer',
    title: "Stream visualizer",
  })
  const inspectorPanel = event.api.addPanel({
    id: 'packet_inspector',
    component: 'packet-inspector',
    title: "Packet inspector",
  })
  const codeGenPanel = event.api.addPanel({
    id: 'code_gen',
    component: 'code-gen',
    title: "Code generator",
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
