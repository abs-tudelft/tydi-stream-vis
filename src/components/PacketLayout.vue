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

const label = computed<string>(() => {
  const path_segments = props.tydiElement.tydiPath?.split('.')
  return path_segments[path_segments.length - 1]
})

</script>

<template>
<div @mouseenter="hover(true)" @mouseleave="hover(false)" :class="['packet-layout', `depth-${depth}`, `${tydiElement.type.toLowerCase()}-packet`, `packet-${isLeaf ? 'leaf' : 'branch'}`]">
  <strong>{{ tydiElement.type }}</strong>: {{ label }}, {{ tydiElement.width }} bits
  <template v-if="!isLeaf" v-for="[key, value] in Object.entries(data).reverse()" :key="key">
    <packet-layout :data="value" :tydi-element="(tydiElement as TydiGroup).items[key]" :display-type="displayType" :path="path.concat([key])" @hover="emission => emit('hover', emission)" />
  </template>
  <span class="packet-representation" v-else>
    {{ representation }}
  </span>
</div>
</template>

<style>
@reference "../assets/main.css";

.packet-layout {
  @apply px-2 pl-4 py-1;
  @apply border-1;
  @apply border-l-4;
  @apply bg-gray-100;
  @apply dark:bg-gray-700;
  @apply text-gray-600;
  @apply dark:text-gray-300;
  @apply font-mono;
  @apply whitespace-nowrap;
  @apply overflow-hidden;
  @apply text-ellipsis;
  @apply my-2;
}

.packet-layout.depth-0 {
  @apply my-0
}

.group-packet {
  @apply border-green-400 bg-green-50;
}

.union-packet {
  @apply border-yellow-400 bg-yellow-50;
}

.bits-packet {
  @apply border-blue-400 bg-blue-50;
  /*@apply pl-2;*/
}

.packet-representation {
  @apply float-right;
}
</style>