import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseCreate2 } from '../src/lib/diagnostics.js';

test('doctor flags zero deployer and zero salt', () => {
  const report = diagnoseCreate2({
    deployer: '0x0000000000000000000000000000000000000000',
    salt: '0x00',
    initCode: '0x00',
  });
  assert.ok(report.findings.some((item) => item.code === 'ZERO_DEPLOYER'));
  assert.ok(report.findings.some((item) => item.code === 'ZERO_SALT'));
});
