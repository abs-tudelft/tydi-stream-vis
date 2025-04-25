import * as Blockly from 'blockly'
import {javascriptGenerator, Order} from 'blockly/javascript'

javascriptGenerator.forBlock['group_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  return `group ${name} {\n${fields}};\n`
}

javascriptGenerator.forBlock['union_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  return `union ${name} {\n${fields}};\n`
}

javascriptGenerator.forBlock['bit_field'] = function (block) {
  const width = block.getFieldValue('WIDTH')
  return [`bit(${width})`, Order.ATOMIC]
}

javascriptGenerator.forBlock['member'] = function (block, generator) {
  const name = block.getFieldValue('MEMBER_NAME')
  const value = generator.valueToCode(block,'MEMBER_VALUE', Order.ATOMIC)
  return `  field ${name}: ${value};\n`
}
