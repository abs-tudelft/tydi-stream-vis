import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

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

javascriptGenerator.forBlock['int_field'] = function (block, _generator) {
  const name = block.getFieldValue('NAME')
  return `  int ${name};\n`
}
