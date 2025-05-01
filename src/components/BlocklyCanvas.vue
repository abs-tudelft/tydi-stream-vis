<template>
  <div ref="blocklyDiv" class="w-full h-full"></div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import * as Blockly from 'blockly/core'
import 'blockly/blocks' // Optional default blocks
import 'blockly/javascript' // Or your target generator
import '@/blocks/dslBlocks'
import '@/blocks/generators'
import toolbox from "@/blocks/toolbox.ts";
import {tlGenerator} from "@/blocks/generators";

const blocklyDiv = ref<HTMLDivElement | null>(null)
const workspace = ref<Blockly.WorkspaceSvg | null>(null)

const supportedEvents = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
]);

function updateCode(event: any) {
  // Event objects extend `Blockly.Events.Abstract`, but there the type of the `type` property is string instead of an actual event type.

  let _workspace = workspace.value!;
  if (_workspace.isDragging()) return; // Don't update while changes are happening.
  if (!supportedEvents.has(event.type)) return;

  // @ts-ignore There is some mismatch between the properties of the workspace object and the expected type.
  const code = tlGenerator.workspaceToCode(_workspace);
  console.log(code);
}

onMounted(() => {
  if (!blocklyDiv.value) {
    return;
  }
  workspace.value = Blockly.inject(blocklyDiv.value, {
    toolbox: toolbox,
    grid: {
      spacing: 20,
      length: 3,
      colour: '#ccc',
      snap: true
    },
    zoom: {
      controls: true,
      wheel: false
    },
    trashcan: true
  })

  workspace.value.addChangeListener(updateCode);
})
</script>

<style scoped>
/* Make sure it stretches to full container */
div {
  width: 100%;
  height: 100%;
}
</style>
