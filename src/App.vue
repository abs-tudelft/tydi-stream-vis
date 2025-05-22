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
import {renderManagement} from "blockly";
import type {Schema} from "@/schemaParser.ts";
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
  streamlet.setFieldValue('RootStreamlet', "NAME")

  const stream = workspace.newBlock('stream_def')
  stream.initSvg()
  stream.setFieldValue('MyStream', "NAME")
  streamlet.getInput("STREAM")?.connection!.connect(stream.outputConnection!)

  processNode(schema, stream, stream.getInput("E")?.connection!)

  function processNode(node: Schema, parentBlock: Blockly.BlockSvg, parentConnection: Blockly.Connection) {
    switch (node.type) {
      case 'object':
        const group = workspace.newBlock('group_def')
        group.initSvg()
        group.outputConnection.connect(parentConnection)
        let fields = []
        let connection = group.getInput("FIELDS")?.connection!

        for (let [cName, cType] of Object.entries(node.properties!)) {
          const memberBlock = workspace.newBlock('member');
          memberBlock.initSvg()
          fields.push(memberBlock)
          connection.connect(memberBlock.previousConnection!)
          connection = memberBlock.nextConnection

          memberBlock.setFieldValue(cName, "MEMBER_NAME")
          processNode(cType, memberBlock, memberBlock.getInput("MEMBER_VALUE")?.connection!)
        }
        // parentBlock.getInput("FIELDS")?.connection!.connect(group.outputConnection!)
        break
      case 'array':
        const streamBlock = workspace.newBlock('stream_def')
        streamBlock.initSvg()
        const parentName = parentBlock.getFieldValue('MEMBER_NAME') ?? parentBlock.getFieldValue('NAME') ?? "MyStream"
        streamBlock.setFieldValue(parentName, "NAME")
        parentConnection!.connect(streamBlock.outputConnection!)
        processNode(node.items!, streamBlock, streamBlock.getInput("E")?.connection!)
        break
      case 'number':
        const bitsBlock = workspace.newBlock('bit_field')
        bitsBlock.initSvg()
        bitsBlock.setFieldValue(64, "WIDTH")
        parentConnection!.connect(bitsBlock.outputConnection!)
        break
      case 'boolean':
        const boolBlock = workspace.newBlock('bit_field')
        boolBlock.initSvg()
        boolBlock.setFieldValue(1, "WIDTH")
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
