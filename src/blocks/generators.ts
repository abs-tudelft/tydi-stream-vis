import * as Blockly from 'blockly'

export const tlGenerator = new Blockly.Generator('TydiLang');

const definitions: string[] = [];

export function generateCode(workspace: Blockly.Workspace) {
  definitions.length = 0 // clear from previous runs
  const mainCode = tlGenerator.workspaceToCode(workspace)
  const allDefinitions = definitions.join('\n\n')
  return allDefinitions + '\n\n' + mainCode
}

function indent(code: string, level: number = 1, indentStr = '  '): string {
  return code
      .split('\n')
      .map(line => indentStr.repeat(level) + line)
      .join('\n')
}

// Make sure subsequent statements are all emitted.
tlGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + ";\n" + tlGenerator.blockToCode(nextBlock);
  }
  return code;
};

const Order = {
  ATOMIC: 0,
};

tlGenerator.forBlock['streamlet'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const stream = generator.valueToCode(block, 'STREAM', Order.ATOMIC);
  return ""+
`streamlet ${name} {
  output: ${stream} out;
};`
}

tlGenerator.forBlock['stream_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const c = block.getFieldValue('C')
  const d = block.getFieldValue('D')
  const n = block.getFieldValue('N')
  const r = (block.getFieldValue('R') === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, 'E', Order.ATOMIC)
  const u = generator.valueToCode(block, 'U', Order.ATOMIC)
  const definition = `type ${name} = Stream(${e}, c=${c}, d=${d}, n=${n}, r=${r}, u=${u});`
  definitions.push(definition)
  return [name, Order.ATOMIC]
}

tlGenerator.forBlock['group_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  const definition = `Group ${name} {\n${fields};\n};`
  definitions.push(definition)
  return [name, Order.ATOMIC]
}

tlGenerator.forBlock['union_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  const definition = `Union ${name} {\n${fields};\n};`
  definitions.push(definition)
  return [name, Order.ATOMIC]
}

tlGenerator.forBlock['bit_field'] = function (block) {
  const width = block.getFieldValue('WIDTH')
  return [`Bit(${width})`, Order.ATOMIC]
}

tlGenerator.forBlock['member'] = function (block, generator) {
  const name = block.getFieldValue('MEMBER_NAME')
  const value = generator.valueToCode(block,'MEMBER_VALUE', Order.ATOMIC)
  return `  ${name}: ${value}`
}

tlGenerator.forBlock['logic_null'] = function (block) {
  return [`Null`, Order.ATOMIC]
}
