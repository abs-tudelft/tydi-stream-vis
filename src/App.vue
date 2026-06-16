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
    position: {
      referencePanel: importPanel,
      direction: 'right',
    }
  })

  const visualizerPanel = event.api.addPanel({
    id: 'stream_visualizer',
    component: 'stream-visualizer',
    title: "Stream visualizer",
    position: {
      referencePanel: importPanel,
      direction: 'below',
    }
  })
  const inspectorPanel = event.api.addPanel({
    id: 'packet_inspector',
    component: 'packet-inspector',
    title: "Packet inspector",
    position: {
      referencePanel: blocklyPanel,
    },
    inactive: true,
  })
  const codeGenPanel = event.api.addPanel({
    id: 'code_gen',
    component: 'code-gen',
    title: "Code generator",
    position: {
      referencePanel: importPanel,
      direction: 'within',
    }
  })
  importPanel.api.setActive()
  // event.api.activePanel = importPanel

  // Store the panels in the store so that they can be accessed from anywhere
  store.$patch({
    panels: {
      dataImport: importPanel,
      blocklyCanvas: blocklyPanel,
      streamVisualizer: visualizerPanel,
      packetInspector: inspectorPanel,
      codeGen: codeGenPanel
    }
  })
}

</script>

<style>

@reference "./assets/main.css";

.block-mapping-text {
  opacity: 0.65;
}

</style>
