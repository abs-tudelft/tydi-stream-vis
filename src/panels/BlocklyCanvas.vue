<template>
  <div class="h-full">
    <!-- Todo: maybe add save and load buttons back somehow -->
    <div ref="blocklyDiv" v-show="showCanvas" class="h-full"></div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, type PropType, ref, shallowRef, watch} from 'vue'
import * as Blockly from 'blockly/core'
import 'blockly/blocks' // Optional default blocks
import 'blockly/javascript' // Or your target generator
import '@/blocks/dslBlocks.ts'
import type {IDockviewPanelProps} from 'dockview-vue'
import toolbox from "@/blocks/toolbox.ts";
import {generateTLCode} from "@/blocks/tlGenerator.ts";
import {generateChiselCode} from "@/blocks/ChiselGenerator.ts";
import {generateClashCode} from "@/blocks/ClashGenerator.ts";
import {TydiStream, TydiStreamlet} from "@/Tydi/TydiTypes.ts";
import {ArrayIndex, ObjectIndex, pathToList} from "@/Tydi/utils.ts";
import type {Schema} from "@/schemaParser.ts";
import {
  bitBArgs, bitBDef,
  groupBArgs, groupBDef,
  memberBArgs, memberBDef,
  streamBArgs, streamBDef,
  stringStreamBDef,
  streamletBArgs, streamletBDef,
  unionBArgs, unionBDef
} from "@/blocks/dslBlocks.ts";
import {useMainStore} from "@/stores/mainStore.ts";

const showCanvas = ref<boolean>(true)

const blocklyDiv = ref<HTMLDivElement | null>(null)
const workspace = shallowRef<Blockly.WorkspaceSvg | null>(null)

const selectedBlockType = ref<string | null>(null)
const selectedBlock = shallowRef<Blockly.BlockSvg | null>(null)
const selectedPath = ref<string | null>(null)

const props = defineProps({
  params: {
    type: Object as PropType<IDockviewPanelProps>,
    required: true,
  }
})

// Resize the Blockly canvas when the tab is resized
props.params.api.onDidDimensionsChange((event) => {
  if (workspace.value === null) return
  Blockly.svgResize(workspace.value as Blockly.WorkspaceSvg);
})

const store = useMainStore()

watch(() => store.dataSchema, (newSchema, oldSchema) => processSchema(newSchema))

onMounted(() => {
  setTimeout(() => {
    blocklyLoadStore()
  }, 50)
})

const supportedEvents = new Set([
  Blockly.Events.BLOCK_CHANGE,
  Blockly.Events.BLOCK_CREATE,
  Blockly.Events.BLOCK_DELETE,
  Blockly.Events.BLOCK_MOVE,
]);

const storageKey = 'tydiStreamVisBlockly';

/** Saves the state of the workspace to browser's local storage. */
function blocklySaveLS() {
  const _workspace = Blockly.getMainWorkspace();
  // @ts-ignore There is some mismatch between the properties of the workspace object and the expected type.
  const data = Blockly.serialization.workspaces.save(_workspace);
  window.localStorage?.setItem(storageKey, JSON.stringify(data));
  console.log("Saved state to local storage.");
}

function blocklyLoadLS() {
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

function blocklyLoadStore() {
  const data = store.blocklyState;
  if (!data) return;

  const _workspace = Blockly.getMainWorkspace();

  // Don't emit events during loading.
  Blockly.Events.disable();
  // @ts-ignore There is some mismatch between the properties of the workspace object and the expected type.
  Blockly.serialization.workspaces.load(data, _workspace, false)
  Blockly.Events.enable();
  console.log("Loaded state from store.");
  updateCode({type: 'change'});
}

function processSchema(schema: any) {
  if (schema === null) return
  // console.log("workspace", blockly.value.workspace);
  // @ts-ignore
  const workspace: Blockly.WorkspaceSvg = Blockly.getMainWorkspace()
  console.log("workspace", workspace);
  console.log("Processing schema", schema)

  workspace.clear()

  const streamlet = workspace.newBlock('streamlet')
  streamlet.initSvg()
  streamlet.render()
  const workspaceSize = workspace.getMetricsManager().getSvgMetrics()
  // Position to the top left corner of the workspace
  streamlet.moveBy(-(workspaceSize.width/2)+200, -(workspaceSize.height/2)+80)
  streamlet.setFieldValue('RootStreamlet', streamletBArgs.NAME)

  processNode(schema, streamlet, streamlet.getInput(streamletBArgs.STREAM)?.connection!, "")

  // After creating the structure, save it to the store
  // Fixme it seems like this does not include the mappings
  store.$patch((state) => {
    state.blocklyState = shallowRef(Blockly.serialization.workspaces.save(workspace))
  })

  function mappingLabel(path: string) {
    return new Blockly.FieldLabel(path, "block-mapping-text")
  }

  function addMapping(block: Blockly.BlockSvg, path: string, prefix: string = "∝") {
    const row = block.appendEndRowInput()
    if (prefix) {
      row.appendField(mappingLabel(prefix))
    }
    row.appendField(mappingLabel(path), "MAPPING")
  }

  function nullableNode(node: Schema, parentBlock: Blockly.BlockSvg, parentConnection: Blockly.Connection, path: string): Blockly.BlockSvg {
    const parentName = parentBlock.getFieldValue('NAME')?.snake2pascal()
    const unionBlock = workspace.newBlock(unionBDef.type)
    unionBlock.initSvg()
    const unionName = (parentName ?? "My") + "Union";
    unionBlock.setFieldValue(unionName, unionBArgs.NAME)
    unionBlock.outputConnection.connect(parentConnection)
    addMapping(unionBlock, `${path}:type`)

    let connection = unionBlock.getInput(unionBArgs.FIELDS)?.connection!

    // const subBlocks = [workspace.newBlock('logic_null'), processNode(node, unionBlock, unionBlock.getInput(unionBArgs.FIELDS)?.connection!)]

    const nullMemberBlock = workspace.newBlock(memberBDef.type);
    nullMemberBlock.initSvg()
    nullMemberBlock.setFieldValue('null', memberBArgs.MEMBER_NAME)
    connection.connect(nullMemberBlock.previousConnection!)
    const nullBlock = workspace.newBlock('logic_null')
    addMapping(nullBlock, `${path}:null`)
    nullBlock.initSvg()
    nullMemberBlock.getInput(memberBArgs.MEMBER_VALUE)?.connection!.connect(nullBlock.outputConnection!)

    const dataMemberBlock = workspace.newBlock(memberBDef.type);
    dataMemberBlock.initSvg()
    nullMemberBlock.nextConnection?.connect(dataMemberBlock.previousConnection!)
    dataMemberBlock.setFieldValue('value', memberBArgs.MEMBER_NAME)
    processNode({...node, nullable: false}, unionBlock, dataMemberBlock.getInput(memberBArgs.MEMBER_VALUE)?.connection!, `${path}:${node.type}`)
    return unionBlock
  }

  function processNode(node: Schema, parentBlock: Blockly.BlockSvg, parentConnection: Blockly.Connection, path: string): Blockly.BlockSvg {
    if (node.nullable === true) {
      return nullableNode(node, parentBlock, parentConnection, path)
    }

    const parentName = parentBlock.getFieldValue('NAME')?.snake2pascal()

    switch (node.type) {
      case 'object':
        const groupBlock = workspace.newBlock(groupBDef.type)
        groupBlock.initSvg()
        const groupName = (parentName ?? "My") + "Group";
        groupBlock.setFieldValue(groupName, groupBArgs.NAME)
        groupBlock.outputConnection.connect(parentConnection)
        let fields = []
        let connection = groupBlock.getInput(groupBArgs.FIELDS)?.connection!
        addMapping(groupBlock, path)

        for (let [cName, cType] of Object.entries(node.properties!)) {
          const memberBlock = workspace.newBlock(memberBDef.type);
          memberBlock.initSvg()
          fields.push(memberBlock)
          connection.connect(memberBlock.previousConnection!)
          connection = memberBlock.nextConnection

          memberBlock.setFieldValue(cName, memberBArgs.MEMBER_NAME)
          processNode(cType, memberBlock, memberBlock.getInput(memberBArgs.MEMBER_VALUE)?.connection!, `${path}.${cName}`)
        }
        return groupBlock
      case 'array':
        const streamBlock = workspace.newBlock(streamBDef.type)
        streamBlock.initSvg()
        const streamName = (parentName ?? "My") + "Stream";
        streamBlock.setFieldValue(streamName, streamBArgs.NAME)
        parentConnection!.connect(streamBlock.outputConnection)
        addMapping(streamBlock, path)
        let d = 1
        let childNode = processNode(node.items!, streamBlock, streamBlock.getInput(streamBArgs.E)?.connection!, `${path}[]`)
        let returnedStreamBlock = streamBlock
        let returnedPath = path
        // If the child is also some kind of stream
        while (childNode !== null && childNode.type.includes('stream')) {
          returnedPath += '[]'
          // Increase the dimension of the child stream
          childNode.setFieldValue(++d, streamBArgs.D)
          childNode.setFieldValue(returnedPath, "MAPPING")
          // Connect the parent to the child stream instead
          parentConnection!.connect(childNode.outputConnection)
          const t = childNode
          childNode = childNode.getInputTargetBlock(streamBArgs.E) as Blockly.BlockSvg
          // Remove the previous stream block
          returnedStreamBlock.dispose(false, false)
          returnedStreamBlock = t
        }
        return returnedStreamBlock
      case 'string':
        const stringStreamBlock = workspace.newBlock(stringStreamBDef.type)
        stringStreamBlock.initSvg()
        stringStreamBlock.setFieldValue(4, stringStreamBDef.argMap.N)
        addMapping(stringStreamBlock, path)
        parentConnection!.connect(stringStreamBlock.outputConnection)
        return stringStreamBlock
      case 'date-time':
        const dtBlock = workspace.newBlock(bitBDef.type)
        dtBlock.initSvg()
        dtBlock.setFieldValue(64, bitBArgs.WIDTH)
        addMapping(dtBlock, path)
        parentConnection!.connect(dtBlock.outputConnection)
        return dtBlock
      case 'number':
        const bitsBlock = workspace.newBlock(bitBDef.type)
        bitsBlock.initSvg()
        bitsBlock.setFieldValue(64, bitBArgs.WIDTH)
        addMapping(bitsBlock, path)
        parentConnection!.connect(bitsBlock.outputConnection)
        return bitsBlock
      case 'boolean':
        const boolBlock = workspace.newBlock(bitBDef.type)
        boolBlock.initSvg()
        boolBlock.setFieldValue(1, bitBArgs.WIDTH)
        addMapping(boolBlock, path)
        parentConnection!.connect(boolBlock.outputConnection)
        return boolBlock
      case 'null':
        const nullBlock = workspace.newBlock('logic_null')
        nullBlock.initSvg()
        addMapping(nullBlock, path)
        parentConnection!.connect(nullBlock.outputConnection)
        return nullBlock
    }
  }
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
  // Write generated code to the store state
  store.$patch((state) => {
    state.tlCode = _tlCode;
    state.chiselCode = _chiselCode;
    state.clashCode = _clashCode;
  })
}

function updateStructure(event: any) {
  let _workspace = workspace.value!;
  if (_workspace.isDragging()) return; // Don't update while changes are happening.
  if (!supportedEvents.has(event.type)) return;

  store.$patch((state) => {
    // Save updated structure to the store so it can be restored later
    store.blocklyState = shallowRef(Blockly.serialization.workspaces.save(_workspace as Blockly.WorkspaceSvg))

    const topBlocks = _workspace.getTopBlocks(false)
    const structures = [] as TydiStreamlet[]
    for (let topBlock of topBlocks) {
      if (topBlock.type !== streamletBDef.type) continue
      structures.push(TydiStreamlet.fromBlock(topBlock))
    }
    store.tydiSchema = shallowRef(structures)
    if (structures.length) {
      state.streamVisualized = shallowRef(structures[0].streams['stream'])
    }
  })
}

watch(() => store.selectedBlock, (newBlock, oldBlock) => {
  if (newBlock === null) return
  setSelection(newBlock as Blockly.BlockSvg)
})

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

  const selected = Blockly.getSelected() as Blockly.BlockSvg
  if (!selected) return;
  // @ts-ignore
  selectedBlock.value = selected
  selectedPath.value = selectedBlock.value!.getFieldValue("MAPPING")
  if (!selectedPath.value) {
    if (selected.type === streamBDef.type) {
      store.selectedPath = []
    } else {
      store.selectedPath = null
    }
    return
  }
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
  store.selectedPath = pathListToEmit
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
