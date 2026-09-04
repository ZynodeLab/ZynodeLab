import { inspectAddress } from './address.js';
import { bytesToHex } from './bytes.js';
import { normalizeSalt, resolveInitCodeHash } from './create2.js';

export function diagnoseCreate2({ deployer, salt, initCode, initCodeHash }) {
  const findings = [];
  const address = inspectAddress(deployer);
  const saltBytes = normalizeSalt(salt);
  const resolved = resolveInitCodeHash({ initCode, initCodeHash });

  if (address.zeroAddress) findings.push({ severity: 'warning', code: 'ZERO_DEPLOYER', message: 'The deployer is the zero address. Confirm this is intentional.' });
  if (saltBytes.every((value) => value === 0)) findings.push({ severity: 'info', code: 'ZERO_SALT', message: 'CREATE2 salt is all zero bytes.' });
  if (resolved.initCodeBytes && resolved.initCodeBytes.length === 0) findings.push({ severity: 'warning', code: 'EMPTY_INIT_CODE', message: 'Initialization code is empty.' });
  if (typeof salt === 'string' && salt.startsWith('utf8:')) findings.push({ severity: 'info', code: 'UTF8_SALT', message: 'Salt text is UTF-8 encoded and left-padded to 32 bytes.' });
  if (typeof salt === 'string' && !salt.startsWith('utf8:') && salt.replace(/^0x/i, '').length < 64) findings.push({ severity: 'info', code: 'PADDED_SALT', message: 'Hex salt is left-padded to the 32-byte CREATE2 salt width.' });
  if (deployer !== address.checksummed) findings.push({ severity: 'info', code: 'CHECKSUM', message: `Checksummed deployer: ${address.checksummed}` });

  return {
    deployer: address.checksummed,
    salt: bytesToHex(saltBytes),
    initCodeHash: bytesToHex(resolved.initCodeHashBytes),
    findings,
    summary: {
      warnings: findings.filter((item) => item.severity === 'warning').length,
      info: findings.filter((item) => item.severity === 'info').length,
    },
  };
}
