<template>
  <div>
    <div ref="blocklyDiv" style="height: 80vh"></div>

    <div class="text-center mt-3">
      <span class="my-2 block">Represents:</span>
      <div v-for="structure in tydiStructures">
        <code class="bg-amber-50 rounded p-2 inline-block" v-if="structure.streams.length">{{structure.streams[0].repr()}}</code>
      </div>
    </div>
    <div class="flex flex-col justify-center items-center">
      <div class="my-4 flex space-x-4">
        <button @click="blocklySave" class="bg-blue-600 text-white px-4 py-2 rounded shadow">
          Save
        </button>
        <button @click="blocklyLoad" class="bg-red-600 text-white px-4 py-2 rounded shadow">
          Load
        </button>
      </div>
      <div class="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <code-highlight :code="tlCode" language="scala" title="Tydi-Lang code" />
        <code-highlight :code="chiselCode" language="scala" title="Tydi-Chisel code" />
        <code-highlight :code="clashCode" language="haskell" title="Tydi-Clash code" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import * as Blockly from 'blockly/core'
import 'blockly/blocks' // Optional default blocks
import 'blockly/javascript' // Or your target generator
import '@/blocks/dslBlocks'
import toolbox from "@/blocks/toolbox.ts";
import {generateTLCode} from "@/blocks/tlGenerator";
import {generateChiselCode} from "@/blocks/ChiselGenerator";
import CodeHighlight from "@/components/CodeHighlight.vue";
import {generateClashCode} from "@/blocks/ClashGenerator.ts";
import {streamletBDef} from "@/blocks/dslBlocks.ts";
import {TydiStreamlet} from "@/Tydi/TydiTypes.ts";

const emit = defineEmits(['schema-update'])

const blocklyDiv = ref<HTMLDivElement | null>(null)
const workspace = ref<Blockly.WorkspaceSvg | null>(null)
const tlCode = ref('// Start by creating a data structure')
const chiselCode = ref('// Start by creating a data structure')
const clashCode = ref('-- Start by creating a data structure')

const tydiStructures = ref<TydiStreamlet[]>([])

const selectedBlockType = ref<String | null>(null)
const selectedPath = ref<String | null>(null)

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
  updateCode({type: 'change'});
}

function updateCode(event: any) {
  // Event objects extend `Blockly.Events.Abstract`, but there the type of the `type` property is string instead of an actual event type.

  let _workspace = workspace.value!;
  if (_workspace.isDragging()) return; // Don't update while changes are happening.
  if (!supportedEvents.has(event.type)) return;

  // @ts-ignore There is some mismatch between the properties of the workspace object and the expected type.
  const _tlCode = generateTLCode(_workspace);
  // @ts-ignore
  const _chiselCode = generateChiselCode(_workspace);
  // @ts-ignore
  const _clashCode = generateClashCode(_workspace);
  tlCode.value = _tlCode;
  chiselCode.value = _chiselCode;
  clashCode.value = _clashCode;
  console.log(_tlCode);
}

function updateStructure(event: any) {
  let _workspace = workspace.value!;
  if (_workspace.isDragging()) return; // Don't update while changes are happening.
  if (!supportedEvents.has(event.type)) return;

  const topBlocks = _workspace.getTopBlocks(false)
  const structures: TydiStreamlet[] = []
  for (let topBlock of topBlocks) {
    if (topBlock.type !== streamletBDef.type) continue
    structures.push(TydiStreamlet.fromBlock(topBlock))
  }
  tydiStructures.value = structures
  emit("schema-update", structures)
}

function updateSelection(event: any) {
  if (event.type !== Blockly.Events.SELECTED) return

  const selected = Blockly.getSelected()
  if (!selected) return;
  // @ts-ignore
  const selectedBlock: Blockly.BlockSvg = selected
  selectedPath.value = selectedBlock.getFieldValue("MAPPING")
  selectedBlockType.value = selectedBlock.type
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
    scrollbars: true,
    move: {
      drag: true
    },
    zoom: {
      controls: true,
      wheel: false
    },
    trashcan: true
  })

  workspace.value.addChangeListener(updateCode);
  workspace.value.addChangeListener(updateStructure);
  workspace.value.addChangeListener(updateSelection);
})
</script>

<style scoped>
</style>
