<template>
  <div class="code-editor-container">
    <div class="flex justify-between items-center bg-gray-800 text-white p-2 rounded-t-lg">
      <div class="text-sm font-medium">{{ title }}</div>
      <div class="flex space-x-2">
        <button
          @click="copyCode"
          class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
        <button
          @click="clearCode"
          class="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Clear
        </button>
      </div>
    </div>

    <div class="relative">
      <!-- Highlighted background layer -->
      <pre
        ref="highlightLayer"
        class="highlight-layer rounded-b-lg m-0 pointer-events-none inset-0 z-10"
        aria-hidden="true"
      ><code :class="languageClass"></code></pre>

      <!-- Editable textarea -->
      <textarea
        ref="textarea"
        :value="modelValue"
        @input="handleInput"
        @scroll="syncScroll"
        @keydown="handleKeydown"
        class="editor-textarea rounded-b-lg m-0 absolute inset-0 z-20 resize-none"
        :placeholder="placeholder"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      ></textarea>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, nextTick, type PropType } from 'vue';
import hljs from 'highlight.js';
// Import the languages you want to support
import 'highlight.js/lib/languages/javascript';
import 'highlight.js/lib/languages/typescript';
// Import your preferred styling
import 'highlight.js/styles/atom-one-dark.css';

export default defineComponent({
  name: 'CodeEditor',
  props: {
    modelValue: {
      type: String as PropType<string>,
      default: ''
    },
    language: {
      type: String as PropType<string>,
      default: 'javascript'
    },
    title: {
      type: String as PropType<string>,
      default: 'Code Editor'
    },
    placeholder: {
      type: String as PropType<string>,
      default: 'Enter your code here...'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const textarea = ref<HTMLTextAreaElement | null>(null);
    const highlightLayer = ref<HTMLPreElement | null>(null);
    const copied = ref<boolean>(false);
    const languageClass = ref<string>(`language-${props.language}`);

    // Handle input changes
    const handleInput = (event: Event): void => {
      const target = event.target as HTMLTextAreaElement;
      emit('update:modelValue', target.value);
    };

    // Sync scroll between textarea and highlight layer
    const syncScroll = (): void => {
      if (textarea.value && highlightLayer.value) {
        highlightLayer.value.scrollTop = textarea.value.scrollTop;
        highlightLayer.value.scrollLeft = textarea.value.scrollLeft;
      }
    };

    // Handle special key combinations
    const handleKeydown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLTextAreaElement;

      // Handle Tab key for indentation
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const value = target.value;

        if (event.shiftKey) {
          // Remove indentation (Shift+Tab)
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', start);
          const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);

          if (line.startsWith('  ')) {
            const newValue = value.substring(0, lineStart) + line.substring(2) + value.substring(lineEnd === -1 ? value.length : lineEnd);
            emit('update:modelValue', newValue);
            nextTick(() => {
              target.selectionStart = target.selectionEnd = Math.max(lineStart, start - 2);
            });
          }
        } else {
          // Add indentation (Tab)
          const newValue = value.substring(0, start) + '  ' + value.substring(end);
          emit('update:modelValue', newValue);
          nextTick(() => {
            target.selectionStart = target.selectionEnd = start + 2;
          });
        }
      }

      // Handle Enter key for auto-indentation
      if (event.key === 'Enter') {
        const start = target.selectionStart;
        const value = target.value;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const line = value.substring(lineStart, start);
        const indent = line.match(/^(\s*)/)?.[1] || '';

        if (indent) {
          event.preventDefault();
          const newValue = value.substring(0, start) + '\n' + indent + value.substring(start);
          emit('update:modelValue', newValue);
          nextTick(() => {
            target.selectionStart = target.selectionEnd = start + 1 + indent.length;
          });
        }
      }
    };

    // Update syntax highlighting
    const updateHighlighting = (): void => {
      if (highlightLayer.value) {
        const codeElement = highlightLayer.value.querySelector('code');
        if (codeElement) {
          // Clear any previous highlighting
          if (codeElement.hasAttribute('data-highlighted')) {
            codeElement.removeAttribute('data-highlighted');
            codeElement.textContent = '';
          }

          // Set the new content and highlight
          codeElement.textContent = props.modelValue + '\n'; // Add newline to match textarea
          hljs.highlightElement(codeElement);
        }
      }
    };

    // Copy code to clipboard
    const copyCode = (): void => {
      navigator.clipboard.writeText(props.modelValue);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    };

    // Clear all code
    const clearCode = (): void => {
      emit('update:modelValue', '');
      if (textarea.value) {
        textarea.value.focus();
      }
    };

    onMounted(() => {
      updateHighlighting();
    });

    // Watch for changes to update highlighting
    watch(() => props.modelValue, () => {
      nextTick(() => {
        updateHighlighting();
      });
    });

    watch(() => props.language, () => {
      languageClass.value = `language-${props.language}`;
      nextTick(() => {
        updateHighlighting();
      });
    });

    return {
      textarea,
      highlightLayer,
      copied,
      languageClass,
      handleInput,
      syncScroll,
      handleKeydown,
      copyCode,
      clearCode
    };
  }
});
</script>

<style scoped>
@reference "../assets/main.css";

.code-editor-container {
  @apply font-mono text-sm overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 mb-4;
  position: relative;
}

.highlight-layer {
  @apply overflow-hidden bg-gray-100 dark:bg-gray-900;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
}

.highlight-layer code {
  @apply p-4;
}

.editor-textarea {
  @apply p-4 bg-transparent text-transparent caret-white outline-none;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: none;
  resize: none;
  overflow: hidden;
}

/* Make the textarea text invisible but keep the caret visible */
.editor-textarea {
  caret-color: #fff;
}

/* Ensure both layers have the same dimensions */
.highlight-layer,
.editor-textarea {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
}

/* Custom scrollbar for webkit browsers */
.highlight-layer::-webkit-scrollbar,
.editor-textarea::-webkit-scrollbar {
  width: 8px;
}

.highlight-layer::-webkit-scrollbar-track,
.editor-textarea::-webkit-scrollbar-track {
  background: #374151;
}

.highlight-layer::-webkit-scrollbar-thumb,
.editor-textarea::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.highlight-layer::-webkit-scrollbar-thumb:hover,
.editor-textarea::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>