<script setup lang="ts">
import {TydiStream} from "@/Tydi/TydiTypes.ts";
import {computed, type PropType, ref, watch} from "vue";
import * as jsonc from 'jsonc-parser';
import {ArrayIndex, listToPath, ObjectIndex} from "@/Tydi/utils.ts";

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

/**
 * Removes all arrays (including strings) out of an object, recursively.
 * Since only ground types are returned and an otherwise new data structure is constructed, this does not share references with the original data.
 * @param data Data to filter
 */
function dataToElement(data: Object | boolean | number | string | null): Object | boolean | number | string | null {
  if (typeof data !== "object" || data === null) return data
  const newObj = {}
  for (let [key, value] of Object.entries(data)) {
    // Filter out arrays and strings
    if (Array.isArray(value) || typeof value === "string") continue
    // @ts-ignore
    newObj[key] = dataToElement(value)
  }
  return newObj
}

/**
 * Follow a given path through the data stack.
 * @param stack Data to index through
 * @param path Path to follow
 */
function selectData(stack: any, path: (ObjectIndex | ArrayIndex)[]): any {
  if (path.length === 0) return dataToElement(stack)
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

function elRenderer(el: Object | number | string | boolean | null): string {
  switch (typeof el) {
    case "string":
      return '"' + el + '"'
    case "number":
      return el.toPrecision(2)
    case "boolean":
      return String(el)
    case "object":
      if (el === null) return '∅'
      return '{ ⋅ }'
  }
}

</script>

<template>
  <div>Number of physical streams: {{physicalStreams?.length ?? 0}}</div>
  <template v-for="(stream, i) in physicalStreams">
    <h3 class="my-3">Stream {{i}}: {{stream.name}}</h3>
    <div>Stream {{stream.name}} at <kbd>{{stream.tydiPath}}</kbd> of type <kbd>{{stream.physRepr()}}</kbd> that references <kbd>{{stream.dataPath}}</kbd> is nested at dim <kbd>{{stream.dNesting}}</kbd> from root</div>
<!--    <strong class="my-3 block">Data</strong>
    <div><kbd>{{dataThings[i]}}</kbd></div>-->
    <strong class="my-3 block">Packet layout</strong>
    <div>
      <template v-for="item in stream.getItemsFlat()">
        [<kbd>{{item.width}}</kbd> bits @ <kbd>{{listToPath(item.relativePathList)}}</kbd>]
      </template>
    </div>
    <strong class="my-3 block">Stream elements</strong>
    <div class="flex flex-wrap gap-3">
      <template v-for="(item, j) in dataThings[i].flat(stream.dNesting)">
        <div class="tooltip cursor-pointer">
          <div class="tooltip-content">
            <div class="">
              Element #{{j}}
              <pre :class="{'text-left': typeof item === 'object' && item !== null}">{{ item ?? '∅' }}</pre>
            </div>
          </div>
          <kbd class="kbd-blue">{{ elRenderer(item) }} | b{{ stream.width }}</kbd>
        </div>
      </template>
    </div>
    <hr class="my-3">
  </template>
  <div>{{relativePaths}}</div>

</template>

<style scoped>

</style>