import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#tydi-stream-vis-app')

/*// Create shadow root
const hostEl = document.querySelector('#tydi-stream-vis-app')
if (!hostEl) {
    throw new Error('Could not find element with id "tydi-stream-vis-app"')
}
const shadowRoot = hostEl.attachShadow({ mode: 'open' })

// Inject CSS into shadow root
const styleEl = document.createElement('style')
styleEl.textContent = [...document.styleSheets]
    .map(sheet => {
        try {
            return [...sheet.cssRules].map(rule => rule.cssText).join('\n')
        } catch (e) {
            return ''
        }
    })
    .join('\n')
shadowRoot.appendChild(styleEl)

// Mount Vue app inside shadow
const appEl = document.createElement('div')
shadowRoot.appendChild(appEl)

const app = createApp(App)
app.mount(appEl)*/
