<script setup lang="ts">
import CodeHighlight from "@/components/CodeHighlight.vue";
import {ref} from "vue";
import {useMainStore} from "@/stores/mainStore.ts";

const store = useMainStore()

type SelectedTab = "tydilang" | "chisel" | "clash" | "all"
const selectionOptions: SelectedTab[] = ["tydilang", "chisel", "clash", "all"]
const selectedOption = ref<SelectedTab>("tydilang")
</script>

<template>
  <div class="w-full h-full p-4">
    <div role="tablist" class="tabs tabs-border">
      <span class="tab text-black! dark:text-gray-400! pl-0 cursor-default">Show code for:</span>
      <a v-for="option in selectionOptions" role="tab" class="tab"
         :class="{'tab-active': selectedOption === option}"
         @click="selectedOption = option"
      >{{ option }}</a>
    </div>
    <div class="w-full flex gap-x-4 mt-4" key="code wrapper">
      <code-highlight key="tydilang" v-show="(['all', 'tydilang'] as SelectedTab[]).includes(selectedOption)"
                      :code="store.tlCode" language="scala" title="Tydi-Lang code"
                      class="flex-1/3 min-w-0" />
      <code-highlight key="chisel" v-show="(['all', 'chisel'] as SelectedTab[]).includes(selectedOption)"
                      :code="store.chiselCode" language="scala" title="Tydi-Chisel code"
                      class="flex-1/3 min-w-0" />
      <code-highlight key="clash" v-show="(['all', 'clash'] as SelectedTab[]).includes(selectedOption)"
                      :code="store.clashCode" language="haskell" title="Tydi-Clash code"
                      class="flex-1/3 min-w-0" />
    </div>
  </div>
</template>

<style scoped>

</style>