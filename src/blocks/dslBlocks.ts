import * as Blockly from 'blockly'

export interface BlocklyBlockDefinition {
  type: string;
  message0?: string;
  args0?: BlocklyBlockArg[];
  output?: string | string[];
  previousStatement?: string | string[] | null;
  nextStatement?: string | string[] | null;
  colour?: number | string;
  tooltip?: string;
  helpUrl?: string;
  inputsInline?: boolean;
  extensions?: string[];
  mutator?: string;
}

export type BlocklyBlockArg = BlocklyFieldLabel | BlocklyFieldInput | BlocklyFieldNumber | BlocklyFieldCheckbox | BlocklyFieldDropdown | BlocklyFieldAngle | BlocklyFieldColor | BlocklyFieldVariable | BlocklyFieldImage | BlocklyInputValue | BlocklyStatementInput | BlocklyInputEndRow;

export interface BlocklyFieldBase {
  type: string;
  name: string;
}

export interface BlocklyFieldLabel extends BlocklyFieldBase {
  type: "field_label";
  text?: string;
  spellcheck?: boolean;
}

export interface BlocklyFieldInput extends BlocklyFieldBase {
  type: "field_input";
  text?: string;
  spellcheck?: boolean;
}

export interface BlocklyFieldNumber extends BlocklyFieldBase {
  type: "field_number";
  value?: number;
  min?: number;
  max?: number;
  precision?: number;
}

export interface BlocklyFieldCheckbox extends BlocklyFieldBase {
  type: "field_checkbox";
  checked?: "TRUE" | "FALSE" | boolean; // Blockly often uses "TRUE"/"FALSE" strings
}

export interface BlocklyFieldDropdown extends BlocklyFieldBase {
  type: "field_dropdown";
  options: (string | [string, string])[];
}

export interface BlocklyFieldAngle extends BlocklyFieldBase {
  type: "field_angle";
  angle?: number;
}

export interface BlocklyFieldColor extends BlocklyFieldBase {
  type: "field_color";
  colour?: string;
}

export interface BlocklyFieldVariable extends BlocklyFieldBase {
  type: "field_variable";
  variable?: string;
  defaultType?: string;
}

export interface BlocklyFieldImage extends BlocklyFieldBase {
  type: "field_image";
  src: string;
  width: number;
  height: number;
  alt: string;
  flipRtl?: boolean;
}

export interface BlocklyInputValue extends BlocklyFieldBase {
  type: "input_value";
  check?: string | string[];
  align?: "LEFT" | "RIGHT" | "CENTRE";
}

export interface BlocklyStatementInput extends BlocklyFieldBase {
  type: "input_statement";
  check?: string | string[];
  align?: "LEFT" | "RIGHT" | "CENTRE";
}

export interface BlocklyInputEndRow extends BlocklyFieldBase {
  type: "input_end_row";
}

const memberBlockDefinition: BlocklyBlockDefinition = {
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

const bitFieldDefinition: BlocklyBlockDefinition = {
  type: 'bit_field',
  message0: 'Bit (%1)',
  args0: [
    { type: 'field_input', name: 'WIDTH', text: 'bitwidth' }
  ],
  colour: 120,
  tooltip: 'Bit field',
  helpUrl: '',
  output: 'TydiEl'
};

const unionBlockDefinition: BlocklyBlockDefinition = {
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
};

const groupBlockDefinition: BlocklyBlockDefinition = {
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
};

const streamBlock: BlocklyBlockDefinition = {
  type: "stream_def",
  tooltip: "Define a Tydi Stream",
  helpUrl: "",
  message0: "Stream %1 %2 c: %3 d: %4 n: %5 r: %6 %7 e: %8 u: %9",
  args0: [
    {
      type: "field_input",
      name: "NAME",
      text: "MyStream"
    },
    {
      type: "input_end_row",
      name: "STREAM_PARAM"
    },
    {
      type: "field_number",
      name: "C",
      value: 8,
      min: 1,
      max: 8,
      precision: 1
    },
    {
      type: "field_number",
      name: "D",
      value: 1,
      min: 1,
      precision: 1
    },
    {
      type: "field_number",
      name: "N",
      value: 1,
      min: 1,
      precision: 1
    },
    {
      type: "field_checkbox",
      name: "R",
      checked: "FALSE"
    },
    {
      type: "input_end_row",
      name: "STREAM_PARAM"
    },
    {
      type: "input_value",
      name: "E",
      check: "TydiEl"
    },
    {
      type: "input_value",
      name: "U",
      check: "TydiEl"
    }
  ],
  output: [
    "TydiStream",
    "TydiEl"
  ],
  colour: 0,
  inputsInline: false
};

const streamletBlock = {
  type: "streamlet",
  tooltip: "Creates a streamlet that accepts streams",
  helpUrl: "",
  message0: "Streamlet %1 , stream: %2",
  args0: [
    {
      type: "field_input",
      name: "NAME",
      text: "MyStreamlet"
    },
    {
      type: "input_value",
      name: "STREAM",
      check: "TydiStream"
    }
  ],
  colour: 180
};

Blockly.defineBlocksWithJsonArray([
  streamletBlock,
  streamBlock,
  groupBlockDefinition,
  unionBlockDefinition,
  bitFieldDefinition,
  memberBlockDefinition
])
