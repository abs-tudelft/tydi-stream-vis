import {defineStore} from 'pinia'
import * as jsonc from "jsonc-parser";

export const useMainStore = defineStore('main', {
    state: () => ({
        sourceData: null as jsonc.Node | null,
    })
})