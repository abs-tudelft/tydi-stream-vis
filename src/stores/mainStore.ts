import {defineStore} from 'pinia'
import * as jsonc from "jsonc-parser";
import {generateSchema, type Schema} from "@/schemaParser.ts";

export const useMainStore = defineStore('main', {
    state: () => ({
        sourceJson: "",
        parseError: "",
        sourceData: null as jsonc.Node | null,
    }),
    getters: {
        parsedData(state): jsonc.Node | null {
            if (state.sourceJson === '') return null
            let error = ''
            let parsed = null
            try {
                parsed = jsonc.parseTree(state.sourceJson);
                if (parsed === undefined) error = "Error parsing tree";
                if (parsed!.type !== "array") {
                    error = "Root should be an array"
                }
            } catch (e: any) {
                error = e.message
            }
            if (error) {
                this.parseError = error
                return null
            }
            return parsed!
        },
        dataSchema(state): Schema | null {
            if (this.parsedData === null || this.parsedData === undefined) return null
            if (state.parseError !== '') {
                return null
            } else {
                return generateSchema(jsonc.getNodeValue(this.parsedData as jsonc.Node), {detectEnums: true})
            }
        }
    },
})