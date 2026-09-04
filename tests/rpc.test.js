import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectContract, probeNetwork } from '../src/lib/rpc.js';

function mockFetch(results) {
  const previous = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const result = results[request.method];
    return {
      ok: true,
      status: 200,
      async json() { return { jsonrpc: '2.0', id: request.id, result }; },
    };
  };
  return () => { globalThis.fetch = previous; };
}

test('probeNetwork validates Robinhood Chain mainnet identity', async () => {
  const restore = mockFetch({
    eth_chainId: '0x1237',
    eth_blockNumber: '0x10',
    eth_gasPrice: '0x3b9aca00',
  });
  try {
    const report = await probeNetwork({ network: 'mainnet', rpcUrl: 'https://example.invalid' });
    assert.equal(report.chainId, 4663);
    assert.equal(report.chainIdMatches, true);
    assert.equal(report.latestBlock, 16n);
    assert.equal(report.gasPriceWei, 1000000000n);
  } finally {
    restore();
  }
});

test('inspectContract reports code, balance, and nonce', async () => {
  const restore = mockFetch({
    eth_getCode: '0x6000',
    eth_getBalance: '0xde0b6b3a7640000',
    eth_getTransactionCount: '0x2',
  });
  try {
    const report = await inspectContract('0x1111111111111111111111111111111111111111', { rpcUrl: 'https://example.invalid' });
    assert.equal(report.hasCode, true);
    assert.equal(report.codeBytes, 2);
    assert.equal(report.balanceWei, 1000000000000000000n);
    assert.equal(report.nonce, 2n);
  } finally {
    restore();
  }
});
