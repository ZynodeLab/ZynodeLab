import test from 'node:test';
import assert from 'node:assert/strict';
import { explorerAddressUrl, getNetwork } from '../src/lib/network.js';

test('Robinhood Chain mainnet constants are stable', () => {
  const mainnet = getNetwork('mainnet');
  assert.equal(mainnet.chainId, 4663);
  assert.equal(mainnet.chainIdHex, '0x1237');
  assert.equal(mainnet.nativeCurrency.symbol, 'ETH');
  assert.equal(mainnet.rpcUrl, 'https://rpc.mainnet.chain.robinhood.com');
});

test('Robinhood Chain testnet constants are stable', () => {
  const testnet = getNetwork('testnet');
  assert.equal(testnet.chainId, 46630);
  assert.equal(testnet.chainIdHex, '0xb626');
});

test('builds explorer links', () => {
  assert.equal(explorerAddressUrl('0xabc', 'mainnet'), 'https://robinhoodchain.blockscout.com/address/0xabc');
});
