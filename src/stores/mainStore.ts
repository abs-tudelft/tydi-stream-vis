import {defineStore} from 'pinia'
import * as jsonc from "jsonc-parser";
import * as Blockly from 'blockly/core'
import {generateSchema, type Schema} from "@/schemaParser.ts";
import {TydiStream, TydiStreamlet} from "@/Tydi/TydiTypes.ts";
import {ref, shallowRef} from "vue";
import type {TransferEl} from "@/Tydi/TransferTypes.ts";
import type {IDockviewPanel} from "dockview-vue";

export const useMainStore = defineStore('main', {
    state: () => ({
        sourceJson: "",
        parseError: "",
        blocklyState: {} as { [key: string]: any },
        sourceData: null as jsonc.Node | null,
        // In some cases, recursion issues can appear when setting the schema. See note in `BlocklyCanvas.vue`.
        // `shallowRef` does not seem necessary, but it cannot harm either.
        tydiSchema: shallowRef<TydiStreamlet[]>([]),

        streamVisualized: shallowRef<TydiStream | null>(null),
        selectedBlock: null as Blockly.BlockSvg | null,
        selectedPath: null as jsonc.JSONPath | null,
        // Stream and packet inspection
        selectedStream: null as TydiStream | null,
        selectedElement: null as TransferEl | null,

        tlCode: '// Start by creating a data structure',
        chiselCode: '// Start by creating a data structure',
        clashCode: '-- Start by creating a data structure',

        panels: {
            dataImport: {} as IDockviewPanel,
            blocklyCanvas: {} as IDockviewPanel,
            streamVisualizer: {} as IDockviewPanel,
            packetInspector: {} as IDockviewPanel,
            codeGen: {} as IDockviewPanel,
        },
    }),
    getters: {
        // streamVisualized: (state) => state.tydiSchema.length ? state.tydiSchema[0].streams['stream'] : null,
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