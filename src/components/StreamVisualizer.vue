<script setup lang="ts">
import {TydiStream} from "@/Tydi/TydiTypes.ts";
import {computed, ref, watch} from "vue";

const props = defineProps({
  stream: TydiStream,
  inputData: Array,
})

// watch(() => props.stream, () => {})

const selectedIndexes = ref<number[]>([])

const physicalStreams = computed(() => {
  const streams = props.stream?.findStreams();
  selectedIndexes.value = new Array<number>(streams!.length).fill(0);
  return streams
})

const firstStreamItems = computed(() => {
  if (physicalStreams.value === undefined) return []
  return physicalStreams.value[0].getItemsFlat
})

const relativePaths = computed(() => {
  if (physicalStreams.value === undefined) return []
  return physicalStreams.value.map(s => s.dataPath!.replace(s.parent!.dataPath!, ""))
})

function dataAccessor(path: string) {
  const dataPath = path.split(":")[0]
  let pointer: any | any[] = props.inputData!
  // Split path and remove "root"
  const pathSegments = dataPath.split('.').slice(1);
  pathSegments.forEach(pathSegment => {
    if (pointer instanceof Array) {
      pointer = pointer[0] as any
    }
    pointer = pointer[pathSegment]
  })
  return pointer
}

const arrayLengths = computed(() => {
  if (props.inputData === undefined) return []
  let list: any[] = []
  physicalStreams.value?.forEach(stream => {
    list.push(dataAccessor(stream.dataPath!).length)
  })
  return list
})

</script>

<template>
  <div>Number of physical streams: {{physicalStreams?.length ?? 0}}</div>
  <template v-for="stream in physicalStreams">
    <div>Stream {{stream.name}} at <kbd>{{stream.tydiPath}}</kbd> that references <kbd>{{stream.dataPath}}</kbd></div>
    <div>
      <template v-for="item in stream.getItemsFlat()">
        [<kbd>{{item.width}}</kbd> @ <kbd>{{item.dataPath}}</kbd>]
      </template>
    </div>
  </template>
  <div>{{arrayLengths}}</div>
  <div>{{relativePaths}}</div>

</template>

<style scoped>

</style>