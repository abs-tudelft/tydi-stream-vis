<template>
  <div class="flex justify-center items-center h-screen bg-gray-100">
    <div class="flex space-x-16">
      <!-- Left Component -->
      <ComponentBox title="Transmitter" :streams="streams" type="left" :lanes="n" />

      <!-- Bus lanes -->
      <div class="flex flex-col justify-center space-y-1">
        <div
          v-for="lane in n"
          :key="lane"
          class="w-1 h-24 bg-black"
        ></div>
      </div>

      <!-- Right Component -->
      <ComponentBox title="Receiver" :streams="streams" type="right" :lanes="n" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ComponentBox from './components/ComponentBox.vue'

const n = 6 // Number of lanes
const k = 2 // Number of streams

const streams = ref([
  {
    color: 'blue',
    items: ['B<4>', 'B<4>', 'B<4>'],
  },
  {
    color: 'red',
    items: ['B<8>', 'B<8>'],
  },
])
</script>

<style scoped>
</style>
