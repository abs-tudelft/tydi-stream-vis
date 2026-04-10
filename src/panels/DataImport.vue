<script setup lang="ts">
import * as jsonc from 'jsonc-parser';
import CodeHighlight from "@/components/CodeHighlight.vue";
import {computed, ref, watch} from "vue";
import CodeEditorFullSize from "@/components/CodeEditorFullSize.vue";
import {type HighlightChars} from "@/components/CodeEditor.vue";
import {useMainStore} from "@/stores/mainStore.ts";

const store = useMainStore()

const highlights = ref<HighlightChars[]>([])

const schemaCode = computed(() => {
  if (store.dataSchema === null) return '// Schema will be shown here'
  return JSON.stringify(store.dataSchema, null, 2)
})

watch(() => store.selectedPath, (newPath, oldPath) => {
  select(newPath)
})

function select(elementPath: (string | number)[] | null) {
  if (elementPath === null) {
    highlights.value = []
    return
  }
  const path = [... elementPath]
  console.log("Attempting to select", elementPath)
  if (store.parsedData === null || store.parsedData === undefined) return

  let node = jsonc.findNodeAtLocation(store.parsedData! as jsonc.Node, elementPath)

  if (node === undefined) {
    const stringIndex = path.pop()
    node = jsonc.findNodeAtLocation(store.parsedData! as jsonc.Node, path)
    if (node === undefined) return
    if (typeof stringIndex !== "number") throw `String index must be a number, got ${stringIndex}`
    highlights.value = [{ start: node.offset + stringIndex + 1, length: 1 }]
    return
  }

  const offset = node.offset
  const length = node.length
  const lines = store.sourceJson.slice(0, offset).split('\n')
  const lineNumber = lines.length; // 1-based
  highlights.value = [{ start: offset, length: length }]
}

defineExpose({select})
</script>

<template>
  <code-editor-full-size v-model="store.sourceJson" :highlights="highlights" language="javascript" title="Input data" />
</template>

<style scoped>

</style>