import * as Blockly from 'blockly'

export const tlGenerator = new Blockly.Generator('TydiLang');

const Order = {
  ATOMIC: 0,
};

tlGenerator.forBlock['streamlet'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  return `streamlet ${name};\n`
}

tlGenerator.forBlock['stream_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  return `stream ${name};\n`
}

tlGenerator.forBlock['group_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  return `group ${name} {\n${fields}};\n`
}

tlGenerator.forBlock['union_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  return `union ${name} {\n${fields}};\n`
}

tlGenerator.forBlock['bit_field'] = function (block) {
  const width = block.getFieldValue('WIDTH')
  return [`bit(${width})`, Order.ATOMIC]
}

tlGenerator.forBlock['member'] = function (block, generator) {
  const name = block.getFieldValue('MEMBER_NAME')
  const value = generator.valueToCode(block,'MEMBER_VALUE', Order.ATOMIC)
  return `  field ${name}: ${value};\n`
}
