<script setup lang="ts">
import * as jsonc from 'jsonc-parser';
import CodeHighlight from "@/components/CodeHighlight.vue";
import {computed, ref, watch} from "vue";
import CodeEditor from "@/components/CodeEditor.vue";
import {generateSchema} from "@/schemaParser.ts";

const dataCode = ref('')
const emit = defineEmits(['data-input', 'schema-update'])

watch(() => dataCode, () => {
  console.log(dataCode.value)
})

const parsedData = computed(() => {
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
  emit('data-input', parsed)
  return parsed!
})

const schema = computed(() => {
  if (parsedData.value === null || parsedData.value === undefined) return null
  if (parsedData.value.error) {
    return {
      error: parsedData.value.error
    }
  } else {
    return generateSchema(jsonc.getNodeValue(parsedData.value as jsonc.Node))
  }
})

watch(schema, () => {
  emit('schema-update', schema.value)
})

const schemaCode = computed(() => {
  if (schema.value === null) return '// Schema will be shown here'
  return JSON.stringify(schema.value, null, 2)
})
</script>

<template>
  <div class="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
    <code-editor v-model="dataCode" language="javascript" title="Input data" />
    <code-highlight :code="schemaCode" language="javascript" title="Inferred schema" />
  </div>
</template>

<style scoped>

</style>