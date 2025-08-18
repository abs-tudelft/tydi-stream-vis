<script setup lang="ts">

import {computed, type PropType} from "vue";

const props = defineProps({
  data: {
    type: [Object, Number, String, Boolean, null, undefined],
    required: true,
  },
  path: {
    type: Array,
    required: true,
  }
})

const emit = defineEmits<{
  hover: string[]
}>()

const isLeaf = computed(() => typeof props.data !== 'object')
const depth = computed(() => props.path.length)

function hover(enter: boolean) {
  if (isLeaf.value) {
    if (enter) {
      emit('hover', props.path)
    } else {
      emit('hover', [])
    }
  }
}

</script>

<template>
<span @mouseenter="hover(true)" @mouseleave="hover(false)" :class="['data-vector', `depth-${depth}`]">
  <template v-if="!isLeaf" v-for="(value, key) in data" :key="key">
    <data-vector :data="value" :path="path.concat([key])" @hover="emission => emit('hover', emission)" />
  </template>
  <template v-else>
    {{ data }}
  </template>
</span>
</template>

<style scoped>

</style>