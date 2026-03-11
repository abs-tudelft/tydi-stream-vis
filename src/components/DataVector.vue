<script setup lang="ts">

import {type TydiEl, TydiGroup} from "@/Tydi/TydiTypes.ts";
import {computed, type PropType} from "vue";
import {toTwosComplement} from "@/utils.ts";
import type {DisplayType} from "@/components/NumberFormatSelector.vue";

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
  selectedPath: {
    type: Array,
    required: false,
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
  if (enter) {
    emit('hover', props.path)
  } else {
    emit('hover', props.path.slice(0, -1))
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

const isSelected = computed(() => {
  if (props.selectedPath === undefined) return false
  if (depth.value === 0) return false
  return props.selectedPath.join('.') === props.path.join('.')
})

</script>

<template>
<span @mouseenter="hover(true)" @mouseleave="hover(false)" :class="['data-vector', `depth-${depth}`, isSelected ? 'selected' : '']">
  <template v-if="!isLeaf" v-for="[key, value] in Object.entries(data).reverse()" :key="key">
    <data-vector :data="value" :tydi-element="(tydiElement as TydiGroup).items[key]" :display-type="displayType" :path="path.concat([key])" @hover="emission => emit('hover', emission)" :selected-path="selectedPath" />
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

<style>
@reference "../assets/main.css";

.data-vector.depth-1 {
  @apply bg-amber-100;
}

.data-vector.depth-2 {
  @apply bg-red-100;
}

.data-vector.depth-3 {
  @apply bg-purple-100;
}

.data-vector {
  @apply mx-0.5;
  @apply font-mono;
}

.data-vector.selected {
  @apply outline-2 outline-blue-500;
}

.tooltip-content {
  @apply select-none;
}

</style>