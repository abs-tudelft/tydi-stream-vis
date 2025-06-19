<script setup lang="ts">
import * as jsonc from 'jsonc-parser';
import CodeHighlight from "@/components/CodeHighlight.vue";
import {computed, ref, watch} from "vue";
import CodeEditor from "@/components/CodeEditor.vue";
import {type HighlightChars} from "@/components/CodeEditor.vue";
import {generateSchema, type Schema} from "@/schemaParser.ts";

const dataCode = ref('')
const highlights = ref<HighlightChars[]>([])
const emit = defineEmits<{
  'data-input': [data: jsonc.Node],
  'schema-update': [schema: Schema]
}>()

watch(() => dataCode, () => {
  console.log(dataCode.value)
})

const parsedData = computed(() => {
  highlights.value = []
  if (dataCode.value === '') return null
  let error = ''
  let parsed = null
  try {
    parsed = jsonc.parseTree(dataCode.value);
    if (parsed === undefined) error = "Error parsing tree";
    if (parsed!.type !== "array") {
      error = "Root should be an array"
    }
  } catch (e: any) {
    error = e.message
  }
  if (error) {
    return { error: error }
  }
  emit('data-input', parsed as jsonc.Node)
  return parsed!
})

const schema = computed(() => {
  if (parsedData.value === null || parsedData.value === undefined) return null
  if (parsedData.value.error) {
    return {
      error: parsedData.value.error
    }
  } else {
    return generateSchema(jsonc.getNodeValue(parsedData.value as jsonc.Node), {detectEnums: true})
  }
})

watch(schema, () => {
  if (schema.value === null || schema.value === undefined || schema.value.error) return null
  emit('schema-update', schema.value as Schema)
})

const schemaCode = computed(() => {
  if (schema.value === null) return '// Schema will be shown here'
  return JSON.stringify(schema.value, null, 2)
})

function select(elementPath: ("string" | "number")[]) {
  const path = [... elementPath]
  console.log("Attempting to select", elementPath)
  if (parsedData.value === null || parsedData.value === undefined) return

  let node = jsonc.findNodeAtLocation(parsedData.value! as jsonc.Node, elementPath)

  if (node === undefined) {
    const stringIndex = path.pop()
    node = jsonc.findNodeAtLocation(parsedData.value! as jsonc.Node, path)
    if (node === undefined) return
    if (typeof stringIndex !== "number") throw `String index must be a number, got ${stringIndex}`
    highlights.value = [{ start: node.offset + stringIndex + 1, length: 1 }]
    return
  }

  const offset = node.offset
  const length = node.length
  const lines = dataCode.value.slice(0, offset).split('\n')
  const lineNumber = lines.length; // 1-based
  highlights.value = [{ start: offset, length: length }]
}

defineExpose({select})
</script>

<template>
  <div class="w-full flex">
    <code-editor class="grow flex-1/2" v-model="dataCode" :highlights="highlights" language="javascript" title="Input data" />
    <div class="divider divider-horizontal text-center">⮞<br> I<br>n<br>f<br>e<br>r<br> ⮞</div>
    <code-highlight class="grow flex-1/2" :code="schemaCode" language="javascript" title="Inferred schema" />
  </div>
</template>

<style scoped>

</style>