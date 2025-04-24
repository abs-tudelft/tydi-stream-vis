import * as Blockly from 'blockly'

// Group (like struct)
Blockly.defineBlocksWithJsonArray([
  {
    type: 'group_def',
    message0: 'group %1 %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'MyGroup' },
      { type: 'input_statement', name: 'FIELDS' }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 210,
    tooltip: 'Define a data group (like a struct)',
    helpUrl: ''
  },

  // Union
  {
    type: 'union_def',
    message0: 'union %1 %2',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'MyUnion' },
      { type: 'input_statement', name: 'FIELDS' }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 20,
    tooltip: 'Define a union (shared memory layout)',
    helpUrl: ''
  },

  // Int field
  {
    type: 'int_field',
    message0: 'int %1',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'field' }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 120,
    tooltip: 'Integer field',
    helpUrl: ''
  }
])
