<script setup lang="ts">
import CodeHighlight from "@/components/CodeHighlight.vue";
import {ref} from "vue";
import CodeEditor from "@/components/CodeEditor.vue";

const dataCode = ref('')
const schemaCode = ref('// Schema will be shown here')
</script>

<template>
  <div class="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
    <code-editor v-model="dataCode" language="javascript" title="Input data" />
    <code-highlight :code="schemaCode" language="javascript" title="Inferred schema" />
  </div>
</template>

<style scoped>

</style>