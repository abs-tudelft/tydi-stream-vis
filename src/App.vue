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
  streamlet.moveBy(-300, -200)
  streamlet.setFieldValue('RootStreamlet', "NAME")

  const stream = workspace.newBlock('stream_def')
  stream.initSvg()
  stream.setFieldValue('MyStream', "NAME")
  streamlet.getInput("STREAM")?.connection!.connect(stream.outputConnection!)
  renderManagement.finishQueuedRenders();
}

</script>

<style scoped>

</style>
