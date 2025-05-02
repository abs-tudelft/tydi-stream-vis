<template>
  <div class="code-highlight-container">
    <div class="flex justify-between items-center bg-gray-800 text-white p-2 rounded-t-lg">
      <div class="text-sm font-medium">{{ title }}</div>
      <button
        @click="copyCode"
        class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
      >
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre class="rounded-b-lg m-0"><code ref="codeBlock" :class="languageClass"></code></pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import hljs from 'highlight.js';
// Import the languages you want to support
import 'highlight.js/lib/languages/haskell';
import 'highlight.js/lib/languages/scala';
import 'highlight.js/lib/languages/c';
import 'highlight.js/lib/languages/cpp';
// Import your preferred styling (choose one)
// import 'highlight.js/styles/atom-one-dark.css';
import 'highlight.js/styles/github.css';
// import 'highlight.js/styles/dracula.css';

export default defineComponent({
  name: 'CodeHighlight',
  props: {
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      default: 'c'
    },
    title: {
      type: String,
      default: 'Code'
    }
  },
  setup(props) {
    const codeBlock = ref<HTMLElement | null>(null);
    const copied = ref<boolean>(false);
    const languageClass = ref<string>(`language-${props.language}`);

    // Highlight the code when the component is mounted
    const highlightCode = (): void => {
      if (codeBlock.value) {
        // Clear any previous highlighting
        if (codeBlock.value.hasAttribute('data-highlighted')) {
          codeBlock.value.removeAttribute('data-highlighted');
          codeBlock.value.textContent = '';
        }

        // Set the new content and highlight
        codeBlock.value.textContent = props.code;
        hljs.highlightElement(codeBlock.value);
      }
    };

    // Copy code to clipboard
    const copyCode = (): void => {
      navigator.clipboard.writeText(props.code);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    };

    onMounted(() => {
      highlightCode();
    });

    // Re-highlight whenever code or language changes
    watch(() => props.code, highlightCode);
    watch(() => props.language, () => {
      languageClass.value = `language-${props.language}`;
      highlightCode();
    });

    return {
      codeBlock,
      copied,
      copyCode,
      languageClass
    };
  }
});
</script>

<style>
</style>