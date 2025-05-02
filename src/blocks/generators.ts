import * as Blockly from 'blockly'

export const tlGenerator = new Blockly.Generator('TydiLang');

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
  const streamBlock = block.getInputTargetBlock('STREAM')
  const streamName = streamBlock?.getFieldValue('NAME') ?? "stream";
  return ""+
`streamlet ${name} {
  type ${streamName} = ${stream};
  output: ${streamName} out;
};\n`
}

tlGenerator.forBlock['stream_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const c = block.getFieldValue('C')
  const d = block.getFieldValue('D')
  const n = block.getFieldValue('N')
  const r = (block.getFieldValue('R') === 'TRUE') ? 'true' : 'false';
  const e = generator.valueToCode(block, 'E', Order.ATOMIC)
  const u = generator.valueToCode(block, 'U', Order.ATOMIC)
  return [`Stream(${e}, c=${c}, d=${d}, n=${n}, r=${r}, u=${u})`, Order.ATOMIC]
}

tlGenerator.forBlock['group_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  return [`Group ${name} {\n${fields};\n};\n`, Order.ATOMIC]
}

tlGenerator.forBlock['union_def'] = function (block, generator) {
  const name = block.getFieldValue('NAME')
  const fields = generator.statementToCode(block, 'FIELDS')
  return [`Union ${name} {\n${fields};\n};\n`, Order.ATOMIC]
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
  return [`null`, Order.ATOMIC]
}
