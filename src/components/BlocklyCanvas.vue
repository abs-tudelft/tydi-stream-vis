<template>
  <div>
    <div class="mt-4 mb-2 flex space-x-4 py-2 justify-center items-center">
      <span>Tydi structure: </span>
      <button @click="blocklySave" class="btn btn-primary px-4 rounded">
        Save
      </button>
      <button @click="blocklyLoad" class="btn btn-secondary rounded">
        Load
      </button>
      <button @click="showCanvas = !showCanvas" class="btn btn-neutral rounded">
        Toggle visibility
      </button>
    </div>

    <div ref="blocklyDiv" v-show="showCanvas" style="height: 80vh" class="blockly-app-wrapper"></div>

    <div class="divider mb-2">⮟ Interface code generation ⮟</div>
    <div role="tablist" class="tabs tabs-border">
      <span class="tab text-black! pl-0 cursor-default">Show code for:</span>
      <a v-for="option in selectionOptions" role="tab" class="tab"
         :class="{'tab-active': selectedOption === option}"
         @click="selectedOption = option"
      >{{ option }}</a>
    </div>
    <div class="w-full flex gap-x-4 mt-4" v-show="selectedOption !== 'none'" key="code wrapper">
      <code-highlight key="tydilang" v-show="(['all', 'tydilang'] as SelectedTab[]).includes(selectedOption)"
                      :code="tlCode" language="scala" title="Tydi-Lang code"
                      class="flex-1/3 min-w-0" />
      <code-highlight key="chisel" v-show="(['all', 'chisel'] as SelectedTab[]).includes(selectedOption)"
                      :code="chiselCode" language="scala" title="Tydi-Chisel code"
                      class="flex-1/3 min-w-0" />
      <code-highlight key="clash" v-show="(['all', 'clash'] as SelectedTab[]).includes(selectedOption)"
                      :code="clashCode" language="haskell" title="Tydi-Clash code"
                      class="flex-1/3 min-w-0" />
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
import {TydiStream, TydiStreamlet} from "@/Tydi/TydiTypes.ts";
import {ArrayIndex, ObjectIndex, pathToList} from "@/Tydi/utils.ts";
import * as jsonc from "jsonc-parser";
import {setSelected} from "blockly/core/common";

type SelectedTab = "tydilang" | "chisel" | "clash" | "all" | "none"
const selectionOptions: SelectedTab[] = ["tydilang", "chisel", "clash", "all", "none"]
const selectedOption = ref<SelectedTab>("tydilang")

const emit = defineEmits<{
  select: [path: jsonc.JSONPath],
  'schema-update': [schema: TydiStreamlet[]],
}>()

const showCanvas = ref<boolean>(true)

const blocklyDiv = ref<HTMLDivElement | null>(null)
const workspace = ref<Blockly.WorkspaceSvg | null>(null)
const tlCode = ref('// Start by creating a data structure')
const chiselCode = ref('// Start by creating a data structure')
const clashCode = ref('-- Start by creating a data structure')

const tydiStructures = ref<TydiStreamlet[]>([])
const tydiSteams = ref<TydiStream[]>([])

const selectedBlockType = ref<string | null>(null)
const selectedBlock = ref<Blockly.BlockSvg | null>(null)
const selectedPath = ref<string | null>(null)

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
  tydiSteams.value = structures[0].streams['stream'].findStreams()
}

function setSelection(block: Blockly.BlockSvg) {
  // Blockly.
  console.log("Setting selection to block", block.id)
  if (selectedBlock.value !== null) {
    selectedBlock.value.unselect()
  }
  selectedBlock.value = block
  block.select()
}

defineExpose({setSelection})

function updateSelection(event: any) {
  if (event.type !== Blockly.Events.SELECTED) return

  const selected = Blockly.getSelected()
  if (!selected) return;
  // @ts-ignore
  selectedBlock.value = selected
  selectedPath.value = selectedBlock.value!.getFieldValue("MAPPING")
  if (!selectedPath.value) return
  const pathList = pathToList(selectedPath.value!)
  const pathListToEmit = pathList.map(el => {
    if (el instanceof ArrayIndex) {
      return 0
    } else {
      return el.name
    }
  })
  selectedBlockType.value = selectedBlock.value!.type
  console.log("Selected block with path", selectedPath.value)
  emit("select", pathListToEmit)
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
