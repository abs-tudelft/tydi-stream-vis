import * as Blockly from 'blockly'

// Group (like struct)
Blockly.defineBlocksWithJsonArray([
  {
    type: 'group_def',
    message0: 'Group %1 {\n%2}',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'MyGroup' },
      { type: 'input_statement', name: 'FIELDS' }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 210,
    tooltip: 'Define a data group (like a struct)',
    helpUrl: '',
    output: 'TydiEl'
  },

  // Union
  {
    type: 'union_def',
    message0: 'Union %1 {\n%2 }',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'MyUnion' },
      { type: 'input_statement', name: 'FIELDS' }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 20,
    tooltip: 'Define a union (shared memory layout)',
    helpUrl: '',
    output: 'TydiEl'
  },

  // Bit field
  {
    type: 'bit_field',
    message0: 'Bit (%1)',
    args0: [
      { type: 'field_input', name: 'WIDTH', text: 'bitwidth' }
    ],
    // previousStatement: ["member"],
    // nextStatement: null,
    colour: 120,
    tooltip: 'Bit field',
    helpUrl: '',
    output: 'TydiEl'
  },

  // Member field
  {
    type: "member",
    message0: "%1 %2 %3",
    args0: [
      { type: "field_input", name: "MEMBER_NAME", text: "" },
      { type: "field_label", name: "COLON", text: ":" },
      { type: "input_value", name: "MEMBER_VALUE" }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: 'Member field for Groups and Unions',
  }
])
