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

    <div class="relative layer-wrapper">
      <!-- Highlighted background layers -->
      <pre
        ref="markingsLayer"
        class="markings-layer code-layer z-10 absolute"
        aria-hidden="true"
      ><code ref="markingsEl"><span class="code-highlight"></span></code></pre>

      <pre
        ref="highlightLayer"
        class="highlight-layer code-layer z-15 relative"
        aria-hidden="true"
      ><code ref="codeEl" :class="languageClass"></code></pre>

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

export interface HighlightChars { start: number, length: number, className?: string, type?: string }
export interface HighlightLines { startLine: number, endLine: number, className?: string, type?: string }

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
    },
    highlights: {
      type: Array as PropType<(HighlightChars | HighlightLines)[]>,
      default: () => []
      // Format: [{ start: number, length: number, className?: string, type?: string }]
      // Or: [{ startLine: number, endLine: number, className?: string, type?: string }]
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const textarea = ref<HTMLTextAreaElement | null>(null);
    const highlightLayer = ref<HTMLPreElement | null>(null);
    const codeEl = ref<HTMLPreElement | null>(null);
    const markingsLayer = ref<HTMLPreElement | null>(null);
    const markingsEl = ref<HTMLPreElement | null>(null);
    const copied = ref<boolean>(false);
    const languageClass = ref<string>(`language-${props.language}`);

    // Handle input changes
    const handleInput = (event: Event): void => {
      const target = event.target as HTMLTextAreaElement;
      emit('update:modelValue', target.value);
    };

    // Sync scroll between textarea and highlight layer
    const syncScroll = (): void => {
      if (textarea.value && codeEl.value && markingsEl.value) {
        codeEl.value.scrollTop = textarea.value.scrollTop;
        codeEl.value.scrollLeft = textarea.value.scrollLeft;
        markingsEl.value.scrollTop = textarea.value.scrollTop;
        markingsEl.value.scrollLeft = textarea.value.scrollLeft;
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

    const wrapTextWithHighlights = (text: string, highlights: (HighlightChars | HighlightLines)[]) => {
      if (!highlights || highlights.length === 0) return text;

      // Convert line-based highlights to character-based if needed
      const charHighlights = highlights.map(highlight => {
        if (highlight.startLine !== undefined) {
          return convertLineToCharHighlight(text, highlight as HighlightLines);
        }
        return highlight as HighlightChars;
      });

      // Sort highlights by start position (descending) to avoid offset issues
      const sortedHighlights = [...charHighlights].sort((a, b) => b.start - a.start);

      let result = text;

      sortedHighlights.forEach(highlight => {
        const { start, length, className = 'code-highlight', type = 'highlight' } = highlight;
        const end = start + length;

        if (start >= 0 && end <= result.length) {
          const before = result.substring(0, start);
          const highlighted = result.substring(start, end);
          const after = result.substring(end);

          result = before +
            `<span class="${className}" data-highlight-type="${type}">` +
            highlighted +
            '</span>' +
            after;
        }
      });

      return result;
    };

    const convertLineToCharHighlight = (text: string, lineHighlight: HighlightLines): HighlightChars => {
      const lines = text.split('\n');
      const { startLine, endLine = startLine, className, type } = lineHighlight;

      // Calculate character offset for start line
      let start = 0;
      for (let i = 0; i < startLine - 1; i++) {
        start += lines[i].length + 1; // +1 for newline
      }

      // Calculate length
      let length = 0;
      for (let i = startLine - 1; i <= Math.min(endLine - 1, lines.length - 1); i++) {
        length += lines[i].length;
        if (i < endLine - 1) length += 1; // Add newline except for last line
      }

      return { start, length, className, type };
    };

    const updateMarkings = () => {
      if (!markingsLayer.value) return
      // Apply text highlights first
      const textWithHighlights = wrapTextWithHighlights(props.modelValue, props.highlights);

      // Set the content with highlight spans
      markingsEl.value!.innerHTML = textWithHighlights + '\n';
    }

    const updateHighlighting = () => {
      if (!highlightLayer.value) return

      const codeElement = highlightLayer.value.querySelector('code');
      if (codeElement) {
        // Clear any previous highlighting
        if (codeElement.hasAttribute('data-highlighted')) {
          codeElement.removeAttribute('data-highlighted');
          codeElement.textContent = '';
        }

        codeElement.textContent = props.modelValue + '\n';

        // Apply syntax highlighting while preserving our highlight spans
        hljs.highlightElement(codeElement);
        updateMarkings();
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
        textarea.value.value = "";
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

    watch(() => props.highlights, () => {
      nextTick(() => {
        updateMarkings();
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
      codeEl,
      markingsLayer,
      markingsEl,
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

<style>
@reference "../assets/main.css";

.code-editor-container {
  @apply font-mono text-sm overflow-hidden rounded-lg;
  position: relative;
}

.layer-wrapper {
  background-color: #282c34;
  @apply rounded-b-lg;
}

.code-layer {
  @apply overflow-hidden;
  /*@apply bg-gray-50 dark:bg-gray-900;*/
  @apply block w-full;
  @apply m-0 pointer-events-none;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
  /*position: absolute;*/
}

.code-layer code {
  @apply p-4! block;
  @apply bg-transparent!;
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
.code-layer code,
.editor-textarea {
  min-height: 200px;
  max-height: 60vh;
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

.code-highlight {
  background-color: rgba(134, 142, 255, 0.3);
  border-radius: 2px;
  text-shadow: rgba(0, 0, 0, 0.58) 0 0 5px;
  margin: 0px -2px;
  padding: 0 2px;
}

.highlighted-line {
  background-color: rgba(255, 255, 0, 0.1);
  display: block;
  width: 100%;
  padding: 0 4px;
  margin: 0 -4px;
}

.error-highlight {
  background-color: rgba(255, 0, 0, 0.2);
  border-bottom: 2px wavy #ff0000;
}

.warning-highlight {
  background-color: rgba(255, 165, 0, 0.2);
  border-bottom: 2px wavy #ffa500;
}
</style>