<script setup lang="ts">
import {TydiStream} from "@/Tydi/TydiTypes.ts";
import {computed, type PropType, ref, watch} from "vue";
import * as jsonc from 'jsonc-parser';
import {ArrayIndex, ObjectIndex} from "@/Tydi/utils.ts";

const props = defineProps({
  stream: {
    type: TydiStream,
    required: true,
  },
  inputData: Object as PropType<jsonc.Node>,
})

const data = computed(() => {
  if (!props.inputData) return {}
  return jsonc.getNodeValue(props.inputData!)
})

// watch(() => props.stream, () => {})

const selectedIndexes = ref<number[]>([])

const physicalStreams = computed(() => {
  const streams = props.stream.findStreams();
  selectedIndexes.value = new Array<number>(streams.length).fill(0);
  return streams
})

const firstStreamItems = computed(() => {
  if (physicalStreams.value === undefined) return []
  return physicalStreams.value[0].getItemsFlat
})

const relativePaths = computed(() => {
  if (physicalStreams.value === undefined) return []
  return physicalStreams.value.map(s => { return {
    parentPath: s.parent!.dataPath!,
    relativePath: s.dataPath!.replace(s.parent!.dataPath!, "")
  }})
})

function selectData(stack: any, path: (ObjectIndex | ArrayIndex)[]): any[] {
  if (path.length === 0) return stack
  // From the tydi perspective a string is an array, while from the js perspective it is one value.
  // Therefore, we convert strings to arrays.
  const newStack = (typeof stack === "string") ? Array.from(stack) : stack;

  if (path[0] instanceof ArrayIndex) {
    if (newStack === null || newStack.map === undefined) {
      // This can be the case for arrays with different types
      return [newStack]
    }
    return (newStack as any[]).map((item) => selectData(item, path.slice(1)))
  }
  return selectData(newStack[path[0].name], path.slice(1))
}

const dataThings = computed(() => {
  return physicalStreams.value.map(s => {
    const path = s.dataPathList
    return selectData(data.value, [...path, new ArrayIndex()])
  })
})

</script>

<template>
  <div>Number of physical streams: {{physicalStreams?.length ?? 0}}</div>
  <template v-for="(stream, i) in physicalStreams">
    <div>Stream {{stream.name}} at <kbd>{{stream.tydiPath}}</kbd> of type <kbd>{{stream.e.type}}</kbd> that references <kbd>{{stream.dataPath}}</kbd></div>
    <div>Data: <kbd>{{dataThings[i]}}</kbd></div>
    <div>
      <template v-for="item in stream.getItemsFlat()">
        [<kbd>{{item.width}}</kbd> bits @ <kbd>{{item.dataPath}}</kbd>]
      </template>
    </div>
    <hr class="my-3">
  </template>
  <div>{{relativePaths}}</div>

</template>

<style scoped>

</style>