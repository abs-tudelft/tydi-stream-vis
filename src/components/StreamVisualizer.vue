<script setup lang="ts">
import {TydiStream} from "@/Tydi/TydiTypes.ts";
import {computed, ref} from "vue";

const props = defineProps({
  stream: TydiStream,
  inputData: Array,
})

const physicalStreams = computed(() => {
  return props.stream?.findStreams()
})

const firstStreamItems = computed(() => {
  if (physicalStreams.value === undefined) return []
  return physicalStreams.value[0].getItemsFlat
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

</template>

<style scoped>

</style>