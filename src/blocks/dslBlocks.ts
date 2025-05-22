import * as Blockly from 'blockly'

export interface BlocklyBlockDefinition {
  type: string;
  message0?: string;
  argMap: Record<string, string>;
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

export const memberBArgs = {
  MEMBER_NAME: "MEMBER_NAME",
  COLON: "COLON",
  MEMBER_VALUE: "MEMBER_VALUE"
}

export const memberBDef: BlocklyBlockDefinition = {
  type: "member",
  message0: "%1 %2 %3",
  argMap: memberBArgs,
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

export const bitBArgs = {
  WIDTH: 'WIDTH'
};

export const bitBDef: BlocklyBlockDefinition = {
  type: 'bit_field',
  message0: 'Bit (%1)',
  argMap: bitBArgs,
  args0: [
    { type: 'field_input', name: 'WIDTH', text: 'bitwidth' }
  ],
  colour: 120,
  tooltip: 'Bit field',
  helpUrl: '',
  output: 'TydiEl'
};

export const unionBArgs = {
  NAME: "NAME",
  FIELDS: "FIELDS"
};

export const unionBDef: BlocklyBlockDefinition = {
  type: 'union_def',
  message0: 'Union %1 {\n%2 }',
  argMap: unionBArgs,
  args0: [
    { type: 'field_input', name: 'NAME', text: 'MyUnion' },
    { type: 'input_statement', name: 'FIELDS' }
  ],
  colour: 20,
  tooltip: 'Define a union (shared memory layout)',
  helpUrl: '',
  output: 'TydiEl'
};

export const groupBArgs = {
  NAME: "NAME",
  FIELDS: "FIELDS"
};

export const groupBDef: BlocklyBlockDefinition = {
  type: 'group_def',
  message0: 'Group %1 {\n%2}',
  argMap: groupBArgs,
  args0: [
    { type: 'field_input', name: 'NAME', text: 'MyGroup' },
    { type: 'input_statement', name: 'FIELDS' }
  ],
  colour: 210,
  tooltip: 'Define a data group (like a struct)',
  helpUrl: '',
  output: 'TydiEl'
};

export const streamBArgs = {
  NAME: "NAME",
  C: "C",
  D: "D",
  N: "N",
  R: "R",
  E: "E",
  U: "U"
};

export const streamBDef: BlocklyBlockDefinition = {
  type: "stream_def",
  tooltip: "Define a Tydi Stream",
  helpUrl: "",
  message0: "Stream %1 %2 c: %3 d: %4 n: %5 r: %6 %7 e: %8 u: %9",
  argMap: streamBArgs,
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

export const stringStreamBArgs = {
  C: "C",
  D: "D",
  N: "N",
  R: "R"
};

export const stringStreamBDef: BlocklyBlockDefinition = {
  type: "string_stream_def",
  tooltip: "Place a string stream",
  helpUrl: "",
  message0: "String stream c: %1 d: %2 n: %3 r: %4",
  argMap: streamBArgs,
  args0: [
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
  ],
  output: [
    "TydiStream",
    "TydiEl"
  ],
  colour: 0,
  inputsInline: false
};

export const streamletBArgs = {
  NAME: "NAME",
  STREAM: "STREAM"
};

export const streamletBDef = {
  type: "streamlet",
  tooltip: "Creates a streamlet that accepts streams",
  helpUrl: "",
  message0: "Streamlet %1 , stream: %2",
  argMapping: streamletBArgs,
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
  streamletBDef,
  streamBDef,
  groupBDef,
  unionBDef,
  bitBDef,
  memberBDef,
  stringStreamBDef,
])
