<template>
  <DataImport @schema-update="processSchema" @data-input="(v) => inputData = v" ref="dataImport" />
  <div class="divider">⮟ To Tydi representation ⮟</div>
  <BlocklyCanvas @schema-update="tydiSchemaUpdate" @select="selectData" ref="blockly" />
  <div class="divider">⮟ Physical streams and transfer simulation ⮟</div>
  <StreamVisualizer v-if="streamVisualized" :stream="streamVisualized!" :input-data="inputData" @selectData="selectData" @selectBlock="selectBlock" />
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
import type {Schema} from "@/schemaParser.ts";
import {
  bitBArgs, bitBDef,
  groupBArgs,
  groupBDef,
  memberBArgs,
  memberBDef,
  streamBArgs, streamBDef,
  streamletBArgs, stringStreamBDef, unionBArgs, unionBDef
} from "@/blocks/dslBlocks.ts";
import {TydiStream, type TydiStreamlet} from "@/Tydi/TydiTypes.ts";
import StreamVisualizer from "@/components/StreamVisualizer.vue";
// import StreamSimulator from "@/components/StreamSimulator.vue";

const blockly = ref<typeof BlocklyCanvas>()
const dataImport = ref<typeof DataImport>()
const inputData = ref<jsonc.Node>()
const tydiSchema = ref<TydiStreamlet[]>([])
const streamVisualized = ref<TydiStream>()

function selectData(path: jsonc.JSONPath) {
  dataImport.value!.select(path)
}

function selectBlock(block: Blockly.BlockSvg) {
  blockly.value!.setSelection(block)
}

function processSchema(schema: any) {
  if (schema === null) return
  if (blockly.value === undefined) return
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

function tydiSchemaUpdate(structures: TydiStreamlet[]) {
  tydiSchema.value = structures
  streamVisualized.value = structures[0].streams['stream']
}

</script>

<style>

@reference "./assets/main.css";

.block-mapping-text {
  opacity: 0.65;
}

</style>
