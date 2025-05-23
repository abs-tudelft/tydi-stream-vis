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
import {chiselGenerator} from "@/blocks/ChiselGenerator.ts";

export const tlGenerator = new Blockly.Generator('TydiLang');

const definitions: string[] = [];

export function generateTLCode(workspace: Blockly.Workspace) {
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

tlGenerator.forBlock[streamletBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamletBDef.argMap.NAME)
  const stream = generator.valueToCode(block, streamletBDef.argMap.STREAM, Order.ATOMIC);
  return ""+
`streamlet ${name} {
  output: ${stream} out;
};`
}

tlGenerator.forBlock[streamBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamBDef.argMap.NAME)
  const c = block.getFieldValue(streamBDef.argMap.C)
  const d = block.getFieldValue(streamBDef.argMap.D)
  const n = block.getFieldValue(streamBDef.argMap.N)
  const r = (block.getFieldValue(streamBDef.argMap.R) === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, streamBDef.argMap.E, Order.ATOMIC)
  const u = generator.valueToCode(block, streamBDef.argMap.U, Order.ATOMIC)
  const definition = `type ${name} = Stream(${e}, c=${c}, d=${d}, n=${n}, r=${r}, u=${u});`
  definitions.push(definition)
  return [name, Order.ATOMIC]
}

tlGenerator.forBlock[stringStreamBDef.type] = function (block, generator) {
  const c = block.getFieldValue(stringStreamBDef.argMap.C)
  const d = block.getFieldValue(stringStreamBDef.argMap.D)
  const n = block.getFieldValue(stringStreamBDef.argMap.N)
  const r = (block.getFieldValue(stringStreamBDef.argMap.R) === 'TRUE') ? 'true' : 'false';
  return [`StringStream(c=${c}, d=${d}, n=${n}, r=${r})`, Order.ATOMIC]
}

tlGenerator.forBlock[groupBDef.type] = function (block, generator) {
  const name = block.getFieldValue(groupBDef.argMap.NAME)
  const fields = generator.statementToCode(block, groupBDef.argMap.FIELDS)
  const definition = `Group ${name} {\n${fields};\n};`
  definitions.push(definition)
  return [name, Order.ATOMIC]
}

tlGenerator.forBlock[unionBDef.type] = function (block, generator) {
  const name = block.getFieldValue(unionBDef.argMap.NAME)
  const fields = generator.statementToCode(block, unionBDef.argMap.FIELDS)
  const definition = `Union ${name} {\n${fields};\n};`
  definitions.push(definition)
  return [name, Order.ATOMIC]
}

tlGenerator.forBlock[bitBDef.type] = function (block) {
  const width = block.getFieldValue(bitBDef.argMap.WIDTH)
  return [`Bit(${width})`, Order.ATOMIC]
}

tlGenerator.forBlock[memberBDef.type] = function (block, generator) {
  const name = block.getFieldValue(memberBDef.argMap.MEMBER_NAME)
  const value = generator.valueToCode(block,memberBDef.argMap.MEMBER_VALUE, Order.ATOMIC)
  return `${name}: ${value}`
}

tlGenerator.forBlock['logic_null'] = function (block) {
  return [`Null`, Order.ATOMIC]
}
