<template>
  <ul class="menu menu-horizontal bg-base-200 rounded-box menu-sm mb-3 gap-1 p-1">
    <li @click="emit('update:modelValue', 'decimal')"><a :class="modelValue === 'decimal' ? 'menu-active' : ''">Decimal</a></li>
    <li @click="emit('update:modelValue', 'binary')"><a :class="modelValue === 'binary' ? 'menu-active' : ''">Binary</a></li>
    <li @click="emit('update:modelValue', 'hexadecimal')"><a :class="modelValue === 'hexadecimal' ? 'menu-active' : ''">Hexadecimal</a>
    </li>
  </ul>
</template>
<script setup lang="ts">
export type DisplayType = 'decimal' | 'hexadecimal' | 'binary'

interface NumberFormatSelectorProps {
  modelValue: DisplayType;
}

const props = defineProps<NumberFormatSelectorProps>();
const emit = defineEmits(['update:modelValue']);
</script>

<style>
</style>