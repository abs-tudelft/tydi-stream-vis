<template>
  <div>
    <div ref="blocklyDiv" style="height: 70vh"></div>

    <div class="flex flex-col justify-center items-center bg-gray-100">
      <div class="my-4 flex space-x-4">
        <button @click="blocklySave" class="bg-blue-600 text-white px-4 py-2 rounded shadow">
          Save
        </button>
        <button @click="blocklyLoad" class="bg-red-600 text-white px-4 py-2 rounded shadow">
          Load
        </button>
      </div>
    </div>
  </div>
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

const storageKey = 'tydiStreamVisBlockly';

/** Saves the state of the workspace to browser's local storage. */
function blocklySave() {
  const _workspace = Blockly.getMainWorkspace();
  // @ts-ignore There is some mismatch between the properties of the workspace object and the expected type.
  const data = Blockly.serialization.workspaces.save(_workspace);
  window.localStorage?.setItem(storageKey, JSON.stringify(data));
  console.log("Saved state to local storage.");
}

function blocklyLoad() {
  const data = window.localStorage?.getItem(storageKey);
  if (!data) return;

  const _workspace = Blockly.getMainWorkspace();

  // Don't emit events during loading.
  Blockly.Events.disable();
  // @ts-ignore There is some mismatch between the properties of the workspace object and the expected type.
  Blockly.serialization.workspaces.load(JSON.parse(data), _workspace, false);
  Blockly.Events.enable();
  console.log("Loaded state from local storage.");
}

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
</style>
