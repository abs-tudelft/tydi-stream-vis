import {
    bitBDef,
    groupBDef,
    memberBDef,
    streamBDef,
    streamletBDef,
    unionBDef
} from "@/blocks/dslBlocks.ts";

const toolbox = {
    kind: 'flyoutToolbox',
    contents: [
        { kind: 'block', type: streamletBDef.type },
        { kind: 'block', type: streamBDef.type, inputs: { U: { shadow: { type: 'logic_null' } } } },
        { kind: 'block', type: groupBDef.type },
        { kind: 'block', type: unionBDef.type },
        { kind: 'block', type: memberBDef.type },
        { kind: 'block', type: bitBDef.type },
        // Default blocks for inspration
        // Default blocks for inspiration
        // { kind: 'block', type: 'text' },
        // { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_null' }
    ]
}

export default toolbox
