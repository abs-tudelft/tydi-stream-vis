<script setup lang="ts">
import { ref } from 'vue'
import ComponentBox from './ComponentBox.vue'

const streamItems: string[][] = [
  ['B<4>', 'B<4>', 'B<4>'],
  ['B<8>', 'B<8>'],
]

export interface Stream {
  color: string,
  transmitterItems: string[],
  receiverItems: string[],
  lanes: number,
  inTransit: string[],
}

const streams = ref<Stream[]>([
  {
    color: 'blue',
    transmitterItems: [... streamItems[0]],
    receiverItems: [],
    lanes: 3,
    inTransit: [],
  },
  {
    color: 'red',
    transmitterItems: [... streamItems[1]],
    receiverItems: [],
    lanes: 3,
    inTransit: [],
  },
])

function transferItem() {
  for (const stream of streams.value) {
    if (stream.transmitterItems.length > 0 && stream.inTransit.length < stream.lanes) {
      const item = stream.transmitterItems.shift()
      if (item !== undefined) {
        stream.inTransit.push(item)
      }
    } else if (stream.inTransit.length > 0) {
      const item = stream.inTransit.shift()
      if (item !== undefined) {
        stream.receiverItems.push(item)
      }
    }
  }
}

function reset() {
  for (const [key, stream] of Object.entries(streams.value)) {
    const items = streamItems[key as any];
    stream.transmitterItems = [... items]
    stream.receiverItems = []
    stream.inTransit = []
  }
}
</script>

<template>
  <div class="flex flex-col justify-center items-center h-screen bg-gray-100">
    <div class="mb-4 flex space-x-4">
      <button @click="transferItem" class="bg-blue-600 text-white px-4 py-2 rounded shadow">
        Transfer Next Item
      </button>
      <button @click="reset" class="bg-red-600 text-white px-4 py-2 rounded shadow">
        Reset
      </button>
    </div>
    <div class="flex space-x-16">
      <!-- Left Component -->
      <ComponentBox title="Transmitter" :streams="streams" type="left" />

      <!-- Bus lanes -->
      <div class="flex flex-col justify-center space-y-6">
        <template v-for="(stream, sIdx) in streams" :key="sIdx">
          <div class="flex flex-col items-center space-y-1">
            <transition-group name="fade" tag="div" class="flex flex-col items-center space-y-1">
              <div
                v-for="(item, i) in stream.inTransit"
                :key="`${sIdx}-transit-${i}-${item}`"
                :class="[
                      'w-16 text-center rounded text-white text-xs py-1',
                      stream.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
                    ]"
              >
                {{ item }}
              </div>
            </transition-group>
            <div v-for="i in (stream.lanes - stream.inTransit.length)" :key="`spare-${sIdx}-${i}`" :class="[
                  'w-1 h-6',
                  stream.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
                ]"></div>
          </div>
        </template>
      </div>

      <!-- Right Component -->
      <ComponentBox title="Receiver" :streams="streams" type="right" />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>