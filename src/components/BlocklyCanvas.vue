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

const blocklyDiv = ref<HTMLDivElement | null>(null)
const workspace = ref<Blockly.WorkspaceSvg | null>(null)

onMounted(() => {
  if (blocklyDiv.value) {
    workspace.value = Blockly.inject(blocklyDiv.value, {
      toolbox: {
        kind: 'flyoutToolbox',
        contents: [
          { kind: 'block', type: 'group_def' },
          { kind: 'block', type: 'union_def' },
          { kind: 'block', type: 'int_field' }
        ]
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
      },
      zoom: {
        controls: true,
        wheel: true
      },
      trashcan: true
    })
  }
})
</script>

<style scoped>
/* Make sure it stretches to full container */
div {
  width: 100%;
  height: 100%;
}
</style>
