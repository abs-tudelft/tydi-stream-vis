<template>
  <div class="w-64 h-96 bg-white shadow-md rounded p-2 flex flex-col justify-evenly border">
    <h3 class="text-center font-semibold text-sm">{{ title }}</h3>
    <div class="flex flex-col justify-evenly h-full">
      <div
        v-for="(stream, index) in streams"
        :key="index"
        class="flex justify-between items-center"
      >
        <div
          v-if="type === 'left'"
          class="flex space-x-1 justify-end w-full"
        >
          <div
            v-for="(item, i) in stream.transmitterItems"
            :key="i"
            :class="[
              'w-16 text-center rounded text-white text-xs py-1',
              stream.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
            ]"
          >
            {{ item }}
          </div>
        </div>

        <div
          v-else-if="type === 'right'"
          class="flex space-x-1 justify-start w-full"
        >
          <div
            v-for="(item, i) in stream.receiverItems"
            :key="i"
            :class="[
              'w-16 text-center rounded text-white text-xs py-1',
              stream.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
            ]"
          >
            {{ item }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {Stream} from '../App.vue'

interface Props {
  title: String,
  streams: Stream[],
  type: String,
}

defineProps<Props>()
</script>
