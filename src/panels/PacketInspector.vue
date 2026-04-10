<script setup lang="ts">
import {TydiStream} from "@/Tydi/TydiTypes.ts";
import type {DataEl, Transfer, TransferEl} from "@/Tydi/TransferTypes.ts";
import {computed, type PropType, ref} from "vue";
import * as jsonc from 'jsonc-parser';
import {ArrayIndex, listToPath, ObjectIndex} from "@/Tydi/utils.ts";
import DataVector from "@/components/DataVector.vue";
import PacketLayout from "@/components/PacketLayout.vue";
import type {DisplayType} from "@/components/NumberFormatSelector.vue";
import NumberFormatSelector from "@/components/NumberFormatSelector.vue";
import {useMainStore} from "@/stores/mainStore.ts";

const store = useMainStore()

const data = computed(() => {
  if (!store.parsedData) return {}
  return jsonc.getNodeValue(store.parsedData!)
})

const selectedStream = ref<TydiStream | null>(null)
const selectedElement = ref<TransferEl | null>(null)
const packetStructureDisplayType = ref<DisplayType>('decimal')
const packetDataDisplayType = ref<DisplayType>('decimal')
const hoveredPacketNode = ref<String[] | null>()

const selectedIndexes = ref<number[]>([])

const physicalStreams = computed(() => {
  if (!store.streamVisualized) return []
  const streams = store.streamVisualized.findStreams();
  selectedIndexes.value = new Array<number>(streams.length).fill(0);
  return streams
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
    if (newStack === undefined) { return [null] }
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

function dataVectorHover(path: string[]) {
  hoveredPacketNode.value = path
}

</script>

<template>
  <div class="w-full h-full overflow-auto p-4">
    <h2>Stream information</h2>
    <table class="table">
      <thead>
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
      </thead>
      <tbody>
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
      </tbody>
    </table>
    <h2>Packet inspector</h2>
    <template v-if="selectedElement && selectedStream">
      <table class="table">
        <thead>
        <tr>
          <th>Property</th>
          <th>Value</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>Packet number</td>
          <td>
            <kbd>{{ selectedElement.id }}</kbd>
          </td>
        </tr>
        <tr>
          <td>List indexing</td>
          <td>
            <kbd>{{ selectedElement.indexes }}</kbd>
          </td>
        </tr>
        <tr>
          <td>Dimensionality information</td>
          <td>
            <kbd>[{{ selectedElement.lastParent }}]{{ selectedElement.last }}</kbd>
          </td>
        </tr>
        <tr>
          <td>Packet data</td>
          <td>
            <kbd>{{ (selectedElement as DataEl).data ? selectedElement.data : "" }}</kbd>
          </td>
        </tr>
        <tr>
          <td>Packet layout</td>
          <td>
            Number format:
            <number-format-selector v-model="packetStructureDisplayType"/>
            <packet-layout class="wrap-anywhere -mx-0.5!" :data="selectedElement.data" :tydi-element="selectedStream.e" :path="[]" @hover="dataVectorHover" :display-type="packetStructureDisplayType" :selected-path="hoveredPacketNode" />
          </td>
        </tr>
        <tr>
          <td>Packet data packing</td>
          <td>
            Number format:
            <number-format-selector v-model="packetDataDisplayType"/>
            <br>
            <data-vector class="wrap-anywhere -mx-0.5!" :data="selectedElement.data" :tydi-element="selectedStream.e" :path="[]" @hover="dataVectorHover" :display-type="packetDataDisplayType" :selected-path="hoveredPacketNode" />
          </td>
        </tr>
        </tbody>
      </table>

      <h3>Raw packet data</h3>
      <pre>{{ selectedElement }}</pre>
    </template>
  </div>

</template>

<style scoped>
@reference "../assets/main.css";

</style>