import * as Blockly from 'blockly'
import {
  bitBArgs, bitBDef,
  groupBArgs, groupBDef,
  memberBArgs, memberBDef,
  streamBArgs, streamBDef,
  streamletBArgs, streamletBDef,
  unionBArgs, unionBDef
} from "@/blocks/dslBlocks.ts";
import {chiselGenerator} from "@/blocks/ChiselGenerator.ts";

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

clashGenerator.forBlock[streamletBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamletBArgs.NAME)
  const stream = generator.valueToCode(block, streamletBArgs.STREAM, Order.ATOMIC);
  return ""+
`${name} :: () -> ${stream}`
}

clashGenerator.forBlock[streamBDef.type] = function (block, generator) {
  const name = block.getFieldValue(streamBArgs.NAME)
  const c = block.getFieldValue(streamBArgs.C)
  const d = block.getFieldValue(streamBArgs.D)
  const n = block.getFieldValue(streamBArgs.N)
  const r = (block.getFieldValue(streamBArgs.R) === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, streamBArgs.E, Order.ATOMIC)
  const u = generator.valueToCode(block, streamBArgs.U, Order.ATOMIC)
  const definition = `type ${name} = TydiSynth New (C ${c}) (D ${d}) (N ${n}) ${u} ${e}`
  definitions.push(definition)
  return [`${name}`, Order.ATOMIC]
}

clashGenerator.forBlock[groupBDef.type] = function (block, generator) {
  const name = block.getFieldValue(groupBArgs.NAME)
  const fields = generator.statementToCode(block, groupBArgs.FIELDS)
  const definition = `type ${name} = Group (\n${fields}\n)`
  definitions.push(definition)
  return [`${name}`, Order.ATOMIC]
}

clashGenerator.forBlock[unionBDef.type] = function (block, generator) {
  const name = block.getFieldValue(unionBArgs.NAME)
  const fields = generator.statementToCode(block, unionBArgs.FIELDS)
  const nFields = fields.split('\n').length
  const definition = `type ${name} = Union (\n${fields}\n)`
  definitions.push(definition)
  return [`${name}`, Order.ATOMIC]
}

clashGenerator.forBlock[bitBDef.type] = function (block) {
  const width = block.getFieldValue(bitBArgs.WIDTH)
  return [`Unsigned ${width}`, Order.ATOMIC]
}

clashGenerator.forBlock[memberBDef.type] = function (block, generator) {
  const name = block.getFieldValue(memberBArgs.MEMBER_NAME)
  const value = generator.valueToCode(block,memberBArgs.MEMBER_VALUE, Order.ATOMIC)
  return `${name} >:: ${value}`
}

clashGenerator.forBlock['logic_null'] = function (block) {
  return [`()`, Order.ATOMIC]
}
