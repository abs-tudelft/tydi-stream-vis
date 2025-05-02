import * as Blockly from 'blockly'

// Group (like struct)
Blockly.defineBlocksWithJsonArray([
  // Streamlet
  {
    "type": "streamlet",
    "tooltip": "Creates a streamlet that accepts streams",
    "helpUrl": "",
    "message0": "Streamlet %1 , stream: %2",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "MyStreamlet"
      },
      {
        "type": "input_value",
        "name": "STREAM",
        "check": "TydiStream"
      }
    ],
    "colour": 180
  },

  // Stream
  {
    "type": "stream_def",
    "tooltip": "Define a Tydi Stream",
    "helpUrl": "",
    "message0": "Stream %1 %2 c: %3 d: %4 n: %5 r: %6 %7 e: %8 u: %9",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "MyStream"
      },
      {
        "type": "input_end_row",
        "name": "STREAM_PARAM"
      },
      {
        "type": "field_number",
        "name": "C",
        "value": 8,
        "min": 1,
        "max": 8,
        "precision": 1
      },
      {
        "type": "field_number",
        "name": "D",
        "value": 1,
        "min": 1,
        "precision": 1
      },
      {
        "type": "field_number",
        "name": "N",
        "value": 1,
        "min": 1,
        "precision": 1
      },
      {
        "type": "field_checkbox",
        "name": "R",
        "checked": "FALSE"
      },
      {
        "type": "input_end_row",
        "name": "STREAM_PARAM"
      },
      {
        "type": "input_value",
        "name": "E",
        "check": "TydiEl"
      },
      {
        "type": "input_value",
        "name": "U",
        "check": "TydiEl"
      }
    ],
    "output": [
      "TydiStream",
      "TydiEl"
    ],
    "colour": 0,
    "inputsInline": false
  },

  // Group
  {
    type: 'group_def',
    message0: 'Group %1 {\n%2}',
    args0: [
      { type: 'field_input', name: 'NAME', text: 'MyGroup' },
      { type: 'input_statement', name: 'FIELDS' }
    ],
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
