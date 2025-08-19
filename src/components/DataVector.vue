<script setup lang="ts">

import {type TydiEl, TydiGroup} from "@/Tydi/TydiTypes.ts";
import {computed, type PropType} from "vue";
import {toTwosComplement} from "@/utils.ts";

export type DisplayType = 'decimal' | 'hexadecimal' | 'binary'

const props = defineProps({
  data: {
    type: [Object, Number, String, Boolean, null, undefined],
    required: true,
  },
  tydiElement: {
    type: Object as PropType<TydiEl>,
    required: true,
  },
  path: {
    type: Array,
    required: true,
  },
  displayType: {
    type: String as PropType<DisplayType>,
    default: 'decimal',
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

const representation = computed(() => {
  if (!isLeaf.value || props.data === undefined ) { return ""; }
  if (props.data === null) { return ""; }

  const value = (typeof props.data === 'string') ? props.data.charCodeAt(0) : props.data
  if (props.displayType === 'decimal') {
    return value.toString(10)
  } else if (props.displayType === 'hexadecimal') {
    return value.toString(16)
  } else if (props.displayType === 'binary') {
    return toTwosComplement(value, props.tydiElement.width)
  }
})

</script>

<template>
<span @mouseenter="hover(true)" @mouseleave="hover(false)" :class="['data-vector', `depth-${depth}`]">
  <template v-if="!isLeaf" v-for="(value, key) in data" :key="key">
    <data-vector :data="value" :tydi-element="(tydiElement as TydiGroup).items[key]" :display-type="displayType" :path="path.concat([key])" @hover="emission => emit('hover', emission)" />
  </template>
  <template v-else>
    <div class="tooltip cursor-pointer">
      <div class="tooltip-content z-99">
        <div class="">
          {{ tydiElement.tydiPath }}, {{ tydiElement.width }} bits
          <br>
          References {{ tydiElement.dataPath }}
        </div>
      </div>
      {{ representation }}
    </div>
  </template>
</span>
</template>

<style scoped>

</style>