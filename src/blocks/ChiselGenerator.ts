import * as Blockly from 'blockly'
import {
  bitBArgs, bitBDef,
  groupBArgs, groupBDef,
  memberBArgs, memberBDef,
  streamBArgs, streamBDef,
  streamletBArgs, streamletBDef,
  stringStreamBArgs, stringStreamBDef,
  unionBArgs, unionBDef
} from "@/blocks/dslBlocks.ts";

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

chiselGenerator.forBlock[streamletBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamletBArgs.NAME)
  const stream = generator.valueToCode(block, streamletBArgs.STREAM, Order.ATOMIC);
  return ""+
`class ${name} extends TydiModule {
  private val outputStream = ${stream}
  val output: PhysicalStream = outputStream.toPhysical
}`
}

chiselGenerator.forBlock[streamBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamBArgs.NAME)
  const c = block.getFieldValue(streamBArgs.C)
  const d = block.getFieldValue(streamBArgs.D)
  const n = block.getFieldValue(streamBArgs.N)
  const r = (block.getFieldValue(streamBArgs.R) === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, streamBArgs.E, Order.ATOMIC)
  const u = generator.valueToCode(block, streamBArgs.U, Order.ATOMIC)
  const definition = `class ${name} extends PhysicalStreamDetailed(e=${e}, c=${c}, d=${d}, n=${n}, r=${r}, u=${u})`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock[stringStreamBDef.type] = function (block, generator) {
  const c = block.getFieldValue(stringStreamBArgs.C)
  const d = block.getFieldValue(stringStreamBArgs.D)
  const n = block.getFieldValue(stringStreamBArgs.N)
  const r = (block.getFieldValue(stringStreamBArgs.R) === 'TRUE') ? 'true' : 'false';
  return [`new StringStream(c=${c}, d=${d}, n=${n}, r=${r})`, Order.ATOMIC]
}

chiselGenerator.forBlock[groupBDef.type] = function (block, generator) {
  const name = block.getFieldValue(groupBArgs.NAME)
  const fields = generator.statementToCode(block, groupBArgs.FIELDS)
  const definition = `class ${name} extends Group {\n${fields}\n}`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock[unionBDef.type] = function (block, generator) {
  const name = block.getFieldValue(unionBArgs.NAME)
  const fields = generator.statementToCode(block, unionBArgs.FIELDS)
  const nFields = fields.split('\n').length
  const definition = `class ${name} extends Union(${nFields}) {\n${fields}\n}`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock[bitBDef.type] = function (block) {
  const width = block.getFieldValue(bitBArgs.WIDTH)
  return [`BitsEl(${width}.W)`, Order.ATOMIC]
}

chiselGenerator.forBlock[memberBDef.type] = function (block, generator) {
  const name = block.getFieldValue(memberBArgs.MEMBER_NAME)
  const value = generator.valueToCode(block,memberBArgs.MEMBER_VALUE, Order.ATOMIC)
  return `val ${name} = ${value}`
}

chiselGenerator.forBlock['logic_null'] = function (block) {
  return [`Null()`, Order.ATOMIC]
}
