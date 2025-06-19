<template>
  <DataImport @schema-update="processSchema" @data-input="(v) => inputData = v" />
  <BlocklyCanvas @schema-update="tydiSchemaUpdate" ref="blockly" />
  <StreamVisualizer :stream="streamVisualized!" :input-data="inputData" />
<!--  <stream-simulator />-->
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BlocklyCanvas from './components/BlocklyCanvas.vue'
import DataImport from "@/components/DataImport.vue";
import * as Blockly from "blockly/core";
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
const inputData = ref<any[]>([])
const tydiSchema = ref<TydiStreamlet[]>([])
const streamVisualized = ref<TydiStream | null>(null)

/**
 * Converts a snake_case string to camelCase.
 *
 * @returns The converted string in camelCase.
 */
String.prototype.snake2camel = function (this: string): string {
  if (!this) return ""

  return this.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Converts a snake_case string to PascalCase.
 *
 * @returns The converted string in PascalCase.
 */
String.prototype.snake2pascal = function (this: string): string {
  if (!this) return ""

  return this.snake2camel().replace(/^\w/, (c) => c.toUpperCase());
}

// Extend the String interface to include the string manipulators
declare global {
  interface String {
    snake2camel(): string;
    snake2pascal(): string;
  }
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

  processNode(schema, streamlet, streamlet.getInput(streamletBArgs.STREAM)?.connection!, "root")

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
        parentConnection!.connect(streamBlock.outputConnection!)
        addMapping(streamBlock, path)
        processNode(node.items!, streamBlock, streamBlock.getInput(streamBArgs.E)?.connection!, path)
        return streamBlock
      case 'string':
        const stringStreamBlock = workspace.newBlock(stringStreamBDef.type)
        stringStreamBlock.initSvg()
        addMapping(stringStreamBlock, path)
        parentConnection!.connect(stringStreamBlock.outputConnection!)
        return stringStreamBlock
      case 'number':
        const bitsBlock = workspace.newBlock(bitBDef.type)
        bitsBlock.initSvg()
        bitsBlock.setFieldValue(64, bitBArgs.WIDTH)
        addMapping(bitsBlock, path)
        parentConnection!.connect(bitsBlock.outputConnection!)
        return bitsBlock
      case 'boolean':
        const boolBlock = workspace.newBlock(bitBDef.type)
        boolBlock.initSvg()
        boolBlock.setFieldValue(1, bitBArgs.WIDTH)
        addMapping(boolBlock, path)
        parentConnection!.connect(boolBlock.outputConnection!)
        return boolBlock
      case 'null':
        const nullBlock = workspace.newBlock('logic_null')
        nullBlock.initSvg()
        addMapping(nullBlock, path)
        parentConnection!.connect(nullBlock.outputConnection!)
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
