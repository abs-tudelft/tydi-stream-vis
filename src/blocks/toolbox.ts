const toolbox = {
    kind: 'flyoutToolbox',
    contents: [
        { kind: 'block', type: 'group_def' },
        { kind: 'block', type: 'union_def' },
        { kind: 'block', type: 'member' },
        { kind: 'block', type: 'bit_field' },
        // Default blocks for inspration
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_null' }
    ]
}

export default toolbox
