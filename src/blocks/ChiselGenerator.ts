import * as Blockly from 'blockly'

export const chiselGenerator = new Blockly.Generator('Chisel');

const definitions: string[] = [];
const preamble = `import nl.tudelft.tydi_chisel._
import chisel3._`

export function generateChiselCode(workspace: Blockly.Workspace) {
  definitions.length = 0 // clear from previous runs
  const mainCode = chiselGenerator.workspaceToCode(workspace)
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
chiselGenerator.scrub_ = function(block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + "\n" + chiselGenerator.blockToCode(nextBlock);
  }
  return code;
};

const Order = {
  ATOMIC: 0,
};

chiselGenerator.forBlock['streamlet'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const stream = generator.valueToCode(block, 'STREAM', Order.ATOMIC);
  return ""+
`class ${name} extends TydiModule {
  private val outputStream = ${stream}
  val output: PhysicalStream = outputStream.toPhysical
}`
}

chiselGenerator.forBlock['stream_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const c = block.getFieldValue('C')
  const d = block.getFieldValue('D')
  const n = block.getFieldValue('N')
  const r = (block.getFieldValue('R') === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, 'E', Order.ATOMIC)
  const u = generator.valueToCode(block, 'U', Order.ATOMIC)
  const definition = `class ${name} extends PhysicalStreamDetailed(e=${e}, c=${c}, d=${d}, n=${n}, r=${r}, u=${u})`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock['group_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  const definition = `class ${name} extends Group {\n${fields}\n}`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock['union_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  const nFields = fields.split('\n').length
  const definition = `class ${name} extends Union(${nFields}) {\n${fields}\n}`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock['bit_field'] = function (block) {
  const width = block.getFieldValue('WIDTH')
  return [`BitsEl(${width}.W)`, Order.ATOMIC]
}

chiselGenerator.forBlock['member'] = function (block, generator) {
  const name = block.getFieldValue('MEMBER_NAME')
  const value = generator.valueToCode(block,'MEMBER_VALUE', Order.ATOMIC)
  return `val ${name} = ${value}`
}

chiselGenerator.forBlock['logic_null'] = function (block) {
  return [`Null()`, Order.ATOMIC]
}
