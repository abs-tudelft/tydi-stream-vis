<template>
  <div class="w-48 h-96 bg-white shadow-md rounded p-2 flex flex-col justify-between border">
    <h3 class="text-center font-semibold text-sm">{{ title }}</h3>
    <div class="flex-1 flex flex-col justify-evenly">
      <div
        v-for="(stream, index) in streams"
        :key="index"
        class="flex flex-col items-center space-y-1"
      >
        <div
          v-for="(item, i) in stream.items"
          :key="i"
          :class="[
            'w-20 text-center rounded text-white text-xs py-1',
            stream.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
          ]"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  streams: Array,
  type: String,
  lanes: Number,
})
</script>