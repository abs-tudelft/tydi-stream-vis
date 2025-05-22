<script setup lang="ts">
import CodeHighlight from "@/components/CodeHighlight.vue";
import {computed, ref, watch} from "vue";
import CodeEditor from "@/components/CodeEditor.vue";
import {generateSchema} from "@/schemaParser.ts";

const dataCode = ref('')
const emit = defineEmits(['schema-update'])

watch(() => dataCode, () => {
  console.log(dataCode.value)
})

const parsedData = computed(() => {
  if (dataCode.value === '') return null
  try {
    return JSON.parse(dataCode.value)
  } catch (e: any) {
    return {
      error: e.message
    }
  }
})

const schema = computed(() => {
  if (parsedData.value === null) return null
  if (parsedData.value.error) {
    return {
      error: parsedData.value.error
    }
  } else {
    return generateSchema(parsedData.value)
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