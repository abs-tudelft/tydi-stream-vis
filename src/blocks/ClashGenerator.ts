import * as Blockly from 'blockly'

export const clashGenerator = new Blockly.Generator('Clash');

const definitions: string[] = [];
const preamble = `-- Please note Tydi-Clash is in beta and is not yet polished.`

export function generateClashCode(workspace: Blockly.Workspace) {
  definitions.length = 0 // clear from previous runs
  const mainCode = clashGenerator.workspaceToCode(workspace)
  const allDefinitions = definitions.join('\n\n')
  return preamble + '\n\n' + allDefinitions + '\n\n' + mainCode
}

function indent(code: string, level: number = 1, indentStr = '  '): string {
  return code
      .split('\n')
      .map(line => indentStr.repeat(level) + line)
      .join('\n')
}

// Make sure subsequent statements are all emitted.
clashGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    const parentBlock = block.getSurroundParent()
    const connector = (parentBlock?.type === 'group_def') ? ":&:" : ":|:"
    return `${code} ${connector}\n${clashGenerator.blockToCode(nextBlock)}`;
  }
  return code;
};

const Order = {
  ATOMIC: 0,
};

clashGenerator.forBlock['streamlet'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const stream = generator.valueToCode(block, 'STREAM', Order.ATOMIC);
  return ""+
`${name} :: () -> ${stream}`
}

clashGenerator.forBlock['stream_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const c = block.getFieldValue('C')
  const d = block.getFieldValue('D')
  const n = block.getFieldValue('N')
  const r = (block.getFieldValue('R') === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, 'E', Order.ATOMIC)
  const u = generator.valueToCode(block, 'U', Order.ATOMIC)
  const definition = `type ${name} = TydiSynth New (C ${c}) (D ${d}) (N ${n}) ${u} ${e}`
  definitions.push(definition)
  return [`${name}`, Order.ATOMIC]
}

clashGenerator.forBlock['group_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  const definition = `type ${name} = Group (\n${fields}\n)`
  definitions.push(definition)
  return [`${name}`, Order.ATOMIC]
}

clashGenerator.forBlock['union_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  const nFields = fields.split('\n').length
  const definition = `type ${name} = Union (\n${fields}\n)`
  definitions.push(definition)
  return [`${name}`, Order.ATOMIC]
}

clashGenerator.forBlock['bit_field'] = function (block) {
  const width = block.getFieldValue('WIDTH')
  return [`Unsigned ${width}`, Order.ATOMIC]
}

clashGenerator.forBlock['member'] = function (block, generator) {
  const name = block.getFieldValue('MEMBER_NAME')
  const value = generator.valueToCode(block,'MEMBER_VALUE', Order.ATOMIC)
  return `${name} >:: ${value}`
}

clashGenerator.forBlock['logic_null'] = function (block) {
  return [`()`, Order.ATOMIC]
}
