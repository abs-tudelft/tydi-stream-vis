import * as Blockly from 'blockly'
import {
  bitBDef,
  groupBDef,
  memberBDef,
  streamBDef,
  streamletBDef,
  stringStreamBDef,
  unionBDef
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
  const name = block.getFieldValue(streamletBDef.argMap.NAME)
  const stream = generator.valueToCode(block, streamletBDef.argMap.STREAM, Order.ATOMIC);
  return ""+
`class ${name} extends TydiModule {
  private val outputStream = ${stream}
  val output: PhysicalStream = outputStream.toPhysical
}`
}

chiselGenerator.forBlock[streamBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamBDef.argMap.NAME)
  const c = block.getFieldValue(streamBDef.argMap.C)
  const d = block.getFieldValue(streamBDef.argMap.D)
  const n = block.getFieldValue(streamBDef.argMap.N)
  const r = (block.getFieldValue(streamBDef.argMap.R) === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, streamBDef.argMap.E, Order.ATOMIC)
  const u = generator.valueToCode(block, streamBDef.argMap.U, Order.ATOMIC)
  const definition = `class ${name} extends PhysicalStreamDetailed(e=${e}, c=${c}, d=${d}, n=${n}, r=${r}, u=${u})`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock[stringStreamBDef.type] = function (block, generator) {
  const c = block.getFieldValue(stringStreamBDef.argMap.C)
  const d = block.getFieldValue(stringStreamBDef.argMap.D)
  const n = block.getFieldValue(stringStreamBDef.argMap.N)
  const r = (block.getFieldValue(stringStreamBDef.argMap.R) === 'TRUE') ? 'true' : 'false';
  return [`new StringStream(c=${c}, d=${d}, n=${n}, r=${r})`, Order.ATOMIC]
}

chiselGenerator.forBlock[groupBDef.type] = function (block, generator) {
  const name = block.getFieldValue(groupBDef.argMap.NAME)
  const fields = generator.statementToCode(block, groupBDef.argMap.FIELDS)
  const definition = `class ${name} extends Group {\n${fields}\n}`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock[unionBDef.type] = function (block, generator) {
  const name = block.getFieldValue(unionBDef.argMap.NAME)
  const fields = generator.statementToCode(block, unionBDef.argMap.FIELDS)
  const nFields = fields.split('\n').length
  const definition = `class ${name} extends Union(${nFields}) {\n${fields}\n}`
  definitions.push(definition)
  return [`new ${name}`, Order.ATOMIC]
}

chiselGenerator.forBlock[bitBDef.type] = function (block) {
  const width = block.getFieldValue(bitBDef.argMap.WIDTH)
  return [`BitsEl(${width}.W)`, Order.ATOMIC]
}

chiselGenerator.forBlock[memberBDef.type] = function (block, generator) {
  const name = block.getFieldValue(memberBDef.argMap.MEMBER_NAME)
  const value = generator.valueToCode(block,memberBDef.argMap.MEMBER_VALUE, Order.ATOMIC)
  return `val ${name} = ${value}`
}

chiselGenerator.forBlock['logic_null'] = function (block) {
  return [`Null()`, Order.ATOMIC]
}
