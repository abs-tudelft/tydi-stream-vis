<script setup lang="ts">
import {TydiStream} from "@/Tydi/TydiTypes.ts";
import type {Transfer, TransferEl} from "@/Tydi/TransferTypes.ts";
import {computed, type PropType, ref, watch} from "vue";
import * as jsonc from 'jsonc-parser';
import * as Blockly from "blockly/core";
import {ArrayIndex, listToPath, ObjectIndex} from "@/Tydi/utils.ts";

const props = defineProps({
  stream: {
    type: TydiStream,
    required: true,
  },
  inputData: Object as PropType<jsonc.Node>,
})

const emit = defineEmits<{
  selectData: [path: jsonc.JSONPath],
  selectBlock: [block: Blockly.BlockSvg],
}>()

const data = computed(() => {
  if (!props.inputData) return {}
  return jsonc.getNodeValue(props.inputData!)
})

// watch(() => props.stream, () => {})

const selectedStream = ref<TydiStream | null>(null)

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
  if (data instanceof Date) return data.valueOf()
  const newObj = {}
  for (let [key, value] of Object.entries(data)) {
    let insertValue = value
    // Filter out arrays and strings
    if (Array.isArray(value)) continue
    if (typeof value === "string") {
      if (!value.isDateTime()) continue
      insertValue = new Date(value)
    }
    // @ts-ignore
    newObj[key] = dataToElement(insertValue)
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
  const newStack = (typeof stack === "string") && !stack.isDateTime() ? Array.from(stack) : stack;

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

const dataPackets = computed<TransferEl[][]>(() => {
  return physicalStreams.value.map((s, i) => {
    const packets = s.dataToElements(dataThings.value[i])
    packets.forEach((p, i) => p.id = i)
    return packets
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

function itemClick(item: TransferEl, stream: TydiStream) {
  let i = 0
  const dataPath = stream.dataPathList.map(pathSegment => {
    return pathSegment instanceof ArrayIndex ? item.indexes[i++] : pathSegment.name
  })
  dataPath.push(item.indexes[i])
  if (stream._block !== null) {
    emit("selectBlock", stream._block as Blockly.BlockSvg)
  }
  emit("selectData", dataPath)
}

</script>

<template>
  <div class="flex w-full">
    <div class="min-w-0 flex-1/2">
      <div>Number of physical streams: {{ physicalStreams?.length ?? 0 }}</div>
      <template v-for="(stream, i) in physicalStreams">
        <h3 class="my-3">Stream {{ i }}: {{ stream.name }} <a class="text-blue-500 cursor-pointer" @click="selectedStream = stream">select</a></h3>
        <div>Stream {{ stream.name }} at <kbd>{{ stream.tydiPath }}</kbd> of type <kbd>{{ stream.physRepr() }}</kbd>
          that
          references <kbd>{{ stream.dataPath }}</kbd> is nested at dim <kbd>{{ stream.dNesting }}</kbd> from root
        </div>
        <strong class="my-3 block">Stream elements</strong>
        <div class="flex flex-wrap gap-3">
          <template v-for="(item, j) in dataPackets[i]">
            <div class="tooltip cursor-pointer">
              <div class="tooltip-content">
                <div class="">
                  Element #{{ j }}<br>
                  Last: <span v-if="item.lastParent" class="text-gray-500">[{{ item.lastParent }}]</span>{{ item.last }}
                  <pre v-if="item.data !== undefined"
                       :class="{'text-left': typeof item.data === 'object' && item.data !== null}"
                  >{{ item.data ?? '∅' }}</pre>
                  <span v-else>Empty item</span>
                </div>
              </div>
              <kbd @click="itemClick(item, stream)"
                   :class="item.last.includes('1') ? (item.lastParent.includes('1') ? 'kbd-violet' : 'kbd-fuchsia') : 'kbd-gray'"
              >{{ elRenderer(item.data ? item.data : null) }} | b{{ stream.width }}</kbd>
            </div>
          </template>
        </div>
        <hr class="my-3 border-gray-300">
      </template>
    </div>
    <div class="divider divider-horizontal divider-primary"></div>
    <div class="min-w-0 flex-1/2">
      <div class="sticky top-0">
        <h2>Stream information</h2>
        <table class="table">
          <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
          </tr>
          </thead>
          <tr>
            <td>Name</td>
            <td v-if="selectedStream">
              <kbd>{{ selectedStream.name ? selectedStream.name : 'nameless stream' }}</kbd>
            </td>
          </tr>
          <tr>
            <td>References</td>
            <td v-if="selectedStream">
              <kbd>{{ selectedStream.dataPath ? selectedStream.dataPath : 'root array' }}</kbd>
            </td>
          </tr>
          <tr>
            <td>Packet layout</td>
            <td v-if="selectedStream">
              <template v-for="item in selectedStream.getItemsFlat()">
                [<kbd>{{ item.width }}</kbd> bits @ <kbd>{{ item.relativePathList.length ? listToPath(item.relativePathList) : '.' }}</kbd>]
              </template>
            </td>
          </tr>
          <tr>
            <td>Stream type</td>
            <td v-if="selectedStream">
              <kbd>{{ selectedStream.physRepr() }}</kbd>
            </td>
          </tr>
          <tr>
            <td>Dimension</td>
            <td v-if="selectedStream">
              <kbd>d = {{ selectedStream.d }}</kbd>, nested at <kbd>{{ selectedStream.dNesting }}</kbd> levels from root
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>

</template>

<style scoped>

</style>