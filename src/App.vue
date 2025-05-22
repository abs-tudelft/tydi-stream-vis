<template>
  <DataImport @schema-update="processSchema" />
  <BlocklyCanvas ref="blockly" />
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
  streamletBArgs
} from "@/blocks/dslBlocks.ts";
// import StreamSimulator from "@/components/StreamSimulator.vue";

const schema = ref<any>(null)
const blockly = ref<typeof BlocklyCanvas>()

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

  const stream = workspace.newBlock(streamBDef.type)
  stream.initSvg()
  stream.setFieldValue('MyStream', streamBArgs.NAME)
  streamlet.getInput("STREAM")?.connection!.connect(stream.outputConnection!)

  processNode(schema, stream, stream.getInput(streamBArgs.E)?.connection!)

  function processNode(node: Schema, parentBlock: Blockly.BlockSvg, parentConnection: Blockly.Connection) {
    switch (node.type) {
      case 'object':
        const group = workspace.newBlock(groupBDef.type)
        group.initSvg()
        group.outputConnection.connect(parentConnection)
        let fields = []
        let connection = group.getInput(groupBArgs.FIELDS)?.connection!

        for (let [cName, cType] of Object.entries(node.properties!)) {
          const memberBlock = workspace.newBlock(memberBDef.type);
          memberBlock.initSvg()
          fields.push(memberBlock)
          connection.connect(memberBlock.previousConnection!)
          connection = memberBlock.nextConnection

          memberBlock.setFieldValue(cName, memberBArgs.MEMBER_NAME)
          processNode(cType, memberBlock, memberBlock.getInput(memberBArgs.MEMBER_VALUE)?.connection!)
        }
        break
      case 'array':
        const streamBlock = workspace.newBlock(streamBDef.type)
        streamBlock.initSvg()
        const parentName = parentBlock.getFieldValue('MEMBER_NAME') ?? parentBlock.getFieldValue('NAME') ?? "MyStream"
        streamBlock.setFieldValue(parentName, streamBArgs.NAME)
        parentConnection!.connect(streamBlock.outputConnection!)
        processNode(node.items!, streamBlock, streamBlock.getInput(streamBArgs.E)?.connection!)
        break
      case 'number':
        const bitsBlock = workspace.newBlock(bitBDef.type)
        bitsBlock.initSvg()
        bitsBlock.setFieldValue(64, bitBArgs.WIDTH)
        parentConnection!.connect(bitsBlock.outputConnection!)
        break
      case 'boolean':
        const boolBlock = workspace.newBlock(bitBDef.type)
        boolBlock.initSvg()
        boolBlock.setFieldValue(1, bitBArgs.WIDTH)
        parentConnection!.connect(boolBlock.outputConnection!)
        break
      case 'null':
        const nullBlock = workspace.newBlock('logic_null')
        nullBlock.initSvg()
        parentConnection!.connect(nullBlock.outputConnection!)
        break
    }
  }
}

</script>

<style scoped>

</style>
